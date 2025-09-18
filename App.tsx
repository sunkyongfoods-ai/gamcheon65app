

import React, { useState, useCallback, useMemo } from 'react';
import type { ProductType, CalculatorInput, CalculatorResult, CostBreakdown, CalculationType, MackerelBaitBoxWeight } from './types';
import {
    PURCHASE_COMMISSION_RATE,
    MACKEREL_KG_PER_ORIGINAL_BOX,
    MACKEREL_COSTS_AUCTION,
    MACKEREL_STORAGE_FEES_PER_DAY,
    SQUID_COST_ON_SITE,
    SQUID_COST_WAREHOUSE,
    SQUID_STORAGE_FEE_PER_DAY,
} from './constants';

interface InputFieldProps {
  id: keyof Omit<CalculatorInput, 'productType' | 'calculationType' | 'mackerelBaitBoxWeight'>;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: 'text' | 'number';
  unit?: string;
}

const InputField: React.FC<InputFieldProps> = ({ id, label, value, onChange, placeholder, type = 'text', unit }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label}
        </label>
        <div className="relative">
            <input
                type={type}
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                min="0"
            />
            {unit && <span className="absolute inset-y-0 right-4 flex items-center text-slate-500 dark:text-slate-400">{unit}</span>}
        </div>
    </div>
);


const App: React.FC = () => {
    const [input, setInput] = useState<CalculatorInput>({
        productType: 'mackerel',
        calculationType: 'auction',
        mackerelBaitBoxWeight: 10,
        boxCount: '',
        unitPrice: '',
    });
    const [result, setResult] = useState<CalculatorResult | null>(null);
    const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
    const [error, setError] = useState<string>('');
    
    const resetCalculations = () => {
        setResult(null);
        setBreakdown(null);
        setError('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInput(prev => ({ ...prev, [name]: value }));
        resetCalculations();
    };
    
    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setInput(prev => ({
            ...prev,
            productType: e.target.value as ProductType,
            mackerelBaitBoxWeight: 10,
            boxCount: '',
            unitPrice: '',
        }));
        resetCalculations();
    }

    const handleCalculationTypeChange = (type: CalculationType) => {
        setInput(prev => ({ ...prev, calculationType: type, boxCount: '', unitPrice: '' }));
        resetCalculations();
    };
    
    const handleMackerelWeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setInput(prev => ({ 
            ...prev, 
            mackerelBaitBoxWeight: parseInt(e.target.value, 10) as MackerelBaitBoxWeight 
        }));
        resetCalculations();
    };

    const handleCalculate = useCallback(() => {
        resetCalculations();

        const boxCount = parseFloat(input.boxCount);
        const unitPrice = parseFloat(input.unitPrice);

        if (isNaN(boxCount) || boxCount <= 0 || isNaN(unitPrice) || unitPrice <= 0) {
            setError('수량과 단가를 정확히 입력해주세요.');
            return;
        }
        
        if (input.calculationType === 'auction') {
            const rawPurchasePrice = boxCount * unitPrice;
            const purchaseCommission = rawPurchasePrice * PURCHASE_COMMISSION_RATE;

            if (input.productType === 'mackerel') {
                const baitBoxWeight = input.mackerelBaitBoxWeight;
                const actualPackedWeight = baitBoxWeight * 1.05; // 5% 여유량 적용
                const costs = MACKEREL_COSTS_AUCTION[baitBoxWeight];

                const totalWeight = boxCount * MACKEREL_KG_PER_ORIGINAL_BOX;
                const totalBaitBoxes = totalWeight / actualPackedWeight;
                
                if (totalBaitBoxes === 0 || !isFinite(totalBaitBoxes)) {
                    setError('계산 결과가 유효하지 않습니다. 입력값을 확인해주세요.');
                    return;
                }
                
                const totalOnSiteCost = totalBaitBoxes * costs.onSite;
                const totalWarehouseCost = totalBaitBoxes * costs.warehouse;

                const grandTotalCost = rawPurchasePrice + purchaseCommission + totalOnSiteCost + totalWarehouseCost;
                const costPerBaitBox = grandTotalCost / totalBaitBoxes;

                setResult({
                    totalFinalUnits: totalBaitBoxes,
                    costPerFinalUnit: costPerBaitBox,
                    finalUnitName: '베이트박스',
                    dailyStorageFee: MACKEREL_STORAGE_FEES_PER_DAY[baitBoxWeight],
                });
                
                setBreakdown({
                  rawPurchasePrice,
                  purchaseCommission,
                  totalOnSiteCost,
                  totalWarehouseCost,
                  grandTotalCost,
                });

            } else if (input.productType === 'squid') {
                const panCount = boxCount;
                const totalOnSiteCost = panCount * SQUID_COST_ON_SITE;
                const totalWarehouseCost = panCount * SQUID_COST_WAREHOUSE;
                
                const grandTotalCost = rawPurchasePrice + purchaseCommission + totalOnSiteCost + totalWarehouseCost;
                const costPerPan = grandTotalCost / panCount;

                setResult({
                    totalFinalUnits: panCount,
                    costPerFinalUnit: costPerPan,
                    finalUnitName: 'PAN',
                    dailyStorageFee: SQUID_STORAGE_FEE_PER_DAY,
                });

                setBreakdown({
                    rawPurchasePrice,
                    purchaseCommission,
                    totalOnSiteCost,
                    totalWarehouseCost,
                    grandTotalCost,
                });
            }
        } else { // calculationType === 'warehouse' (Reverse Calculation)
            let totalOnSiteCost = 0;
            let totalWarehouseCost = 0;
            let rawPurchasePrice = 0;
            
            const totalFinalValue = boxCount * unitPrice;

            if (input.productType === 'mackerel') {
                const baitBoxWeight = input.mackerelBaitBoxWeight;
                const costs = MACKEREL_COSTS_AUCTION[baitBoxWeight];
                
                totalOnSiteCost = boxCount * costs.onSite;
                totalWarehouseCost = boxCount * costs.warehouse;
            } else { // productType === 'squid'
                totalOnSiteCost = boxCount * SQUID_COST_ON_SITE;
                totalWarehouseCost = boxCount * SQUID_COST_WAREHOUSE;
            }

            // Reverse calculate rawPurchasePrice from the final value
            // totalFinalValue = (rawPurchasePrice * (1 + commission_rate)) + totalOnSiteCost + totalWarehouseCost
            rawPurchasePrice = (totalFinalValue - totalOnSiteCost - totalWarehouseCost) / (1 + PURCHASE_COMMISSION_RATE);

            if (rawPurchasePrice <= 0 || !isFinite(rawPurchasePrice)) {
                setError('희망단가가 너무 낮아 원가를 계산할 수 없습니다. 비용을 감당할 수 있는 단가를 입력해주세요.');
                return;
            }

            const purchaseCommission = rawPurchasePrice * PURCHASE_COMMISSION_RATE;
            const grandTotalCost = rawPurchasePrice + purchaseCommission + totalOnSiteCost + totalWarehouseCost;

            if (input.productType === 'mackerel') {
                const baitBoxWeight = input.mackerelBaitBoxWeight;
                const actualPackedWeight = baitBoxWeight * 1.05; // 5% 여유량 적용
                const totalWeight = boxCount * actualPackedWeight;
                const originalBoxCount = totalWeight / MACKEREL_KG_PER_ORIGINAL_BOX;
                
                if (originalBoxCount === 0 || !isFinite(originalBoxCount)) {
                    setError('계산 결과가 유효하지 않습니다. 입력값을 확인해주세요.');
                    return;
                }

                const costPerOriginalBox = rawPurchasePrice / originalBoxCount;
                setResult({
                    totalFinalUnits: originalBoxCount,
                    costPerFinalUnit: costPerOriginalBox,
                    finalUnitName: '원고상자',
                    dailyStorageFee: MACKEREL_STORAGE_FEES_PER_DAY[baitBoxWeight],
                });
            } else { // productType === 'squid'
                const costPerPanRaw = rawPurchasePrice / boxCount;
                setResult({
                    totalFinalUnits: boxCount,
                    costPerFinalUnit: costPerPanRaw,
                    finalUnitName: 'PAN',
                    dailyStorageFee: SQUID_STORAGE_FEE_PER_DAY,
                });
            }
    
            setBreakdown({
                rawPurchasePrice,
                purchaseCommission,
                totalOnSiteCost,
                totalWarehouseCost,
                grandTotalCost,
            });
        }
    }, [input]);
    
    const handleReset = () => {
        setInput({ 
            productType: 'mackerel', 
            calculationType: 'auction',
            mackerelBaitBoxWeight: 10,
            boxCount: '', 
            unitPrice: '' 
        });
        resetCalculations();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(value));
    };

    const formatUnits = (value: number) => {
        if (value % 1 === 0) {
            return value.toLocaleString('ko-KR');
        }
        return value.toLocaleString('ko-KR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });
    };

    const isFormValid = useMemo(() => {
        return input.boxCount !== '' && parseFloat(input.boxCount) > 0 && input.unitPrice !== '' && parseFloat(input.unitPrice) > 0;
    }, [input.boxCount, input.unitPrice]);
    
    const labels = useMemo(() => {
        const { productType, calculationType } = input;
        if (productType === 'squid') {
            const unit = 'PAN';
            if (calculationType === 'warehouse') {
                return { boxCount: 'PAN 수량', unitPrice: 'PAN당 희망단가', boxUnit: unit };
            }
            return { boxCount: 'PAN 수량', unitPrice: '단가', boxUnit: unit };
        }
        // Mackerel
        if (calculationType === 'warehouse') {
            return { boxCount: '베이트박스 수량', unitPrice: '베이트박스당 희망단가', boxUnit: '박스' };
        }
        return { boxCount: '원고상자 수량', unitPrice: '원고상자 단가', boxUnit: '상자' };
    }, [input.productType, input.calculationType]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 font-sans">
            <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-10 transition-all duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">감천 경매원가 계산기</h1>
                    <p className="mt-2 font-semibold text-slate-600 dark:text-slate-300">중매인 65번 (주)선경FOODS</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">입력정보</label>
                         <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                            <button onClick={() => handleCalculationTypeChange('auction')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${input.calculationType === 'auction' ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'}`} aria-pressed={input.calculationType === 'auction'}>경매단가</button>
                            <button onClick={() => handleCalculationTypeChange('warehouse')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${input.calculationType === 'warehouse' ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'}`} aria-pressed={input.calculationType === 'warehouse'}>창고출고도</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="productType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">품목 선택</label>
                            <select
                                id="productType"
                                name="productType"
                                value={input.productType}
                                onChange={handleProductChange}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                            >
                                <option value="mackerel">고등어</option>
                                <option value="squid">선동오징어 25kg</option>
                            </select>
                        </div>
                        {input.productType === 'mackerel' && (
                             <div>
                                <label htmlFor="mackerelBaitBoxWeight" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">베이트박스 규격</label>
                                <select
                                    id="mackerelBaitBoxWeight"
                                    name="mackerelBaitBoxWeight"
                                    value={input.mackerelBaitBoxWeight}
                                    onChange={handleMackerelWeightChange}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                                >
                                    <option value={10}>10kg</option>
                                    <option value={15}>15kg</option>
                                    <option value={20}>20kg</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField id="boxCount" label={labels.boxCount} value={input.boxCount} onChange={handleInputChange} placeholder="0" type="number" unit={labels.boxUnit} />
                        <InputField id="unitPrice" label={labels.unitPrice} value={input.unitPrice} onChange={handleInputChange} placeholder="0" type="number" unit="원" />
                    </div>

                    {error && <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg" role="alert">{error}</div>}

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <button onClick={handleCalculate} disabled={!isFormValid} className="w-full flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800">
                            계산하기
                        </button>
                        <button onClick={handleReset} className="w-full sm:w-auto bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-all duration-300">
                            초기화
                        </button>
                    </div>
                </div>

                {result && breakdown && (
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">계산 결과</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-xl">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                    {input.productType === 'mackerel' && input.calculationType === 'warehouse' 
                                        ? '총 원고상자 수량' 
                                        : `총 ${result.finalUnitName} 수량`}
                                </p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatUnits(result.totalFinalUnits)}<span className="text-xl ml-1">
                                    {result.finalUnitName === '베이트박스' ? '박스' : result.finalUnitName === '원고상자' ? '상자' : 'PAN'}
                                </span></p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-xl">
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                     {input.productType === 'mackerel' && input.calculationType === 'warehouse' 
                                        ? '원고상자 25.5kg당 단가'
                                        : input.productType === 'squid' && input.calculationType === 'warehouse'
                                        ? 'PAN당 매입단가 (계산값)'
                                        : `${result.finalUnitName}당 원가`}
                                </p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(result.costPerFinalUnit)}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">원가 상세 내역</h3>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                <li className="flex justify-between items-center">
                                    <span>총 매입원가</span>
                                    <span className="font-mono font-semibold">{formatCurrency(breakdown.rawPurchasePrice)}</span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span>매입 수수료 (3.3%)</span>
                                    <span className="font-mono font-semibold">{formatCurrency(breakdown.purchaseCommission)}</span>
                                </li>
                                {breakdown.totalOnSiteCost > 0 &&
                                <li className="flex justify-between items-center border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                                    <span>총 현장비용</span>
                                    <span className="font-mono font-semibold">{formatCurrency(breakdown.totalOnSiteCost)}</span>
                                </li>
                                }
                                {breakdown.totalWarehouseCost > 0 &&
                                <li className="flex justify-between items-center">
                                    <span>총 창고비용</span>
                                    <span className="font-mono font-semibold">{formatCurrency(breakdown.totalWarehouseCost)}</span>
                                </li>
                                }
                                <li className="flex justify-between items-center border-t border-slate-200 dark:border-slate-600 pt-2 mt-2 font-bold text-slate-800 dark:text-slate-200 text-base">
                                    <span>최종 총 원가</span>
                                    <span className="font-mono">{formatCurrency(breakdown.grandTotalCost)}</span>
                                </li>
                            </ul>
                            <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md space-y-1">
                                {input.productType === 'mackerel' && (
                                    <p>※ 고등어는 5%의 포장 여유량(여량)을 적용하여 계산되었습니다.</p>
                                )}
                                <p>※ 창고 보관료 별도 ({(input.productType === 'mackerel' && input.calculationType === 'warehouse') ? '베이트박스' : result.finalUnitName}당 일일 {result.dailyStorageFee.toLocaleString('ko-KR')}원)</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p><strong>연락처:</strong> 안도갑 이사 <a href="tel:010-7306-5534" className="text-blue-600 dark:text-blue-400 hover:underline">010-7306-5534</a></p>
                    <p><strong>전화:</strong> 051-257-9581 | <strong>팩스:</strong> 051-257-9591</p>
                    <p><strong>이메일:</strong> skfoods@naver.com</p>
                </div>
            </div>
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
              }
            `}</style>
        </div>
    );
};

export default App;