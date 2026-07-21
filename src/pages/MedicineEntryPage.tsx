import React from 'react';
import { useClinic } from '../context/ClinicContext';
import { MedicineItem } from '../types';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Pill, 
  Calculator, 
  Info,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const COMMON_SIDDHA_MEDICINES = [
  "Sanjeevi Parpam",
  "Nilavembu Kudineer Powder",
  "Kabasura Kudineer Choornam",
  "Amukkara Choornam Tablets",
  "Brahmananda Bairavam",
  "Gowri Chinthamani Tablets",
  "Agasthiyar Thailam",
  "Seenthil Chooranam",
  "Thirupala Chooranam",
  "Linga Boopathy",
  "Adathodai Manappagu",
  "Karisalankanni Chooranam",
  "Thuthuvalai Nei",
  "Mathan Thailam",
  "Pinda Thailam",
  "Seeraga Choornam"
];

const FOOD_INSTRUCTIONS = [
  "Before Food",
  "After Food",
  "With Honey after food",
  "With warm water",
  "With hot milk",
  "Empty Stomach",
  "With ginger juice"
];

const UNIT_OPTIONS = [
  "Packs (100g)",
  "Bottles",
  "Tablets (100s)",
  "Grams",
  "Mls",
  "Capsules",
  "Ointment Tube"
];

export const MedicineEntryPage: React.FC = () => {
  const { 
    medicines, 
    updateMedicines, 
    errors, 
    setActiveTab, 
    validateForm, 
    saveCurrentDraft 
  } = useClinic();

  const handleAddRow = () => {
    const newItem: MedicineItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      packQty: 1,
      unit: 'Bottles',
      rate: 100,
      total: 100,
      morning: '1',
      noon: '0',
      night: '1',
      foodInstruction: 'After Food',
      remarks: ''
    };
    updateMedicines([...medicines, newItem]);
  };

  const handleRowChange = (id: string, field: keyof MedicineItem, value: any) => {
    const updated = medicines.map(m => {
      if (m.id === id) {
        const updatedItem = { ...m, [field]: value };
        // If changing qty or rate, recalculate total
        if (field === 'packQty' || field === 'rate') {
          const qty = field === 'packQty' ? Number(value) : m.packQty;
          const rate = field === 'rate' ? Number(value) : m.rate;
          updatedItem.total = Number((qty * rate).toFixed(2));
        }
        return updatedItem;
      }
      return m;
    });
    updateMedicines(updated);
  };

  const handleDeleteRow = (id: string) => {
    const filtered = medicines.filter(m => m.id !== id);
    updateMedicines(filtered);
  };

  const handleDuplicateRow = (index: number) => {
    const rowToCopy = medicines[index];
    const duplicatedRow: MedicineItem = {
      ...rowToCopy,
      id: Math.random().toString(36).substr(2, 9),
      name: rowToCopy.name ? `${rowToCopy.name} (Copy)` : ''
    };
    const updated = [...medicines];
    updated.splice(index + 1, 0, duplicatedRow);
    updateMedicines(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...medicines];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    updateMedicines(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === medicines.length - 1) return;
    const updated = [...medicines];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    updateMedicines(updated);
  };

  const handleNextStep = () => {
    if (validateForm()) {
      saveCurrentDraft();
      setActiveTab('preview');
    } else {
      alert("Please resolve validation errors in the medicine table before compiling PDFs.");
    }
  };

  const grandTotalValue = medicines.reduce((sum, m) => sum + m.total, 0);

  return (
    <div id="medicine-entry-container" className="space-y-6">
      
      {/* Instructions header banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3 text-slate-800 text-xs shadow-xs">
        <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900">Traditional Medicine Prescription Rules</h4>
          <p className="text-slate-600 font-medium">
            Ensure medication names align with authorized Siddha terminology. Dosage quantities and morning/noon/night ticks feed into the Annexure-1 travel manifest, while rates and totals drive the official billing statement.
          </p>
        </div>
      </div>

      {/* Datalists for quick completion */}
      <datalist id="siddha-medicines">
        {COMMON_SIDDHA_MEDICINES.map((med) => (
          <option key={med} value={med} />
        ))}
      </datalist>

      <datalist id="food-instructions">
        {FOOD_INSTRUCTIONS.map((fi) => (
          <option key={fi} value={fi} />
        ))}
      </datalist>

      <datalist id="unit-options">
        {UNIT_OPTIONS.map((uo) => (
          <option key={uo} value={uo} />
        ))}
      </datalist>

      {/* Table Card container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Prescription Formulas Matrix</h3>
          </div>
          <button
            id="med-btn-add-row"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-blue-600/10 border border-blue-600 self-end"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medicine</span>
          </button>
        </div>

        {errors.medicines && (
          <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
            {errors.medicines}
          </div>
        )}

        {medicines.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
            <div className="p-3 bg-slate-100 text-slate-400 rounded-full inline-block">
              <Pill className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">The Medicine Table is empty</p>
              <p className="text-[10px] text-slate-400 mt-1">Click the "+ Add Medicine" button above to insert your first herbal item.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="medicine-form-table" className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-2 text-center w-12">S.No</th>
                  <th className="py-3 px-2 w-56">Medicine Name</th>
                  <th className="py-3 px-2 w-28">Pack Qty</th>
                  <th className="py-3 px-2 w-32">Dosage Unit</th>
                  <th className="py-3 px-2 w-28">Rate (INR)</th>
                  <th className="py-3 px-2 w-24 text-right">Total</th>
                  <th className="py-3 px-2 text-center w-40">Dosage (M - N - N)</th>
                  <th className="py-3 px-2 w-40">Food Details</th>
                  <th className="py-3 px-2 w-48">Specific Remarks</th>
                  <th className="py-3 px-2 text-center w-28">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {medicines.map((med, index) => {
                  const errorName = errors[`med_name_${index}`];
                  const errorRate = errors[`med_rate_${index}`];
                  const errorQty = errors[`med_qty_${index}`];

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* S.No */}
                      <td className="py-2 px-2 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Medicine Name */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={med.name}
                          list="siddha-medicines"
                          placeholder="Herbal formulation..."
                          onChange={(e) => handleRowChange(med.id, 'name', e.target.value)}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs font-semibold outline-hidden ${
                            errorName ? 'border-rose-400 bg-rose-50/25 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                        {errorName && (
                          <span className="text-[9px] text-rose-500 block font-bold mt-0.5">{errorName}</span>
                        )}
                      </td>

                      {/* Pack Qty */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          value={med.packQty || ''}
                          onChange={(e) => handleRowChange(med.id, 'packQty', e.target.value === '' ? 0 : Number(e.target.value))}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs font-semibold text-center outline-hidden ${
                            errorQty ? 'border-rose-400 bg-rose-50/25 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                        {errorQty && (
                          <span className="text-[9px] text-rose-500 block font-bold mt-0.5">{errorQty}</span>
                        )}
                      </td>

                      {/* Dosage Unit */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={med.unit}
                          list="unit-options"
                          placeholder="e.g. Bottles"
                          onChange={(e) => handleRowChange(med.id, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-medium outline-hidden"
                        />
                      </td>

                      {/* Rate */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={med.rate || ''}
                          onChange={(e) => handleRowChange(med.id, 'rate', e.target.value === '' ? 0 : Number(e.target.value))}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs font-semibold outline-hidden text-right ${
                            errorRate ? 'border-rose-400 bg-rose-50/25 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                        {errorRate && (
                          <span className="text-[9px] text-rose-500 block font-bold mt-0.5">{errorRate}</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-2 px-2 text-right font-bold text-slate-800">
                        {med.total.toFixed(2)}
                      </td>

                      {/* Dosage details */}
                      <td className="py-2 px-2">
                        <div className="flex gap-1 items-center justify-center">
                          <input
                            type="text"
                            value={med.morning}
                            placeholder="M"
                            onChange={(e) => handleRowChange(med.id, 'morning', e.target.value)}
                            className="w-10 px-1 py-1 rounded-md border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-center font-bold outline-hidden"
                            title="Morning Dosage"
                          />
                          <span className="text-slate-300">-</span>
                          <input
                            type="text"
                            value={med.noon}
                            placeholder="N"
                            onChange={(e) => handleRowChange(med.id, 'noon', e.target.value)}
                            className="w-10 px-1 py-1 rounded-md border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-center font-bold outline-hidden"
                            title="Noon Dosage"
                          />
                          <span className="text-slate-300">-</span>
                          <input
                            type="text"
                            value={med.night}
                            placeholder="N"
                            onChange={(e) => handleRowChange(med.id, 'night', e.target.value)}
                            className="w-10 px-1 py-1 rounded-md border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-center font-bold outline-hidden"
                            title="Night Dosage"
                          />
                        </div>
                      </td>

                      {/* Food details */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={med.foodInstruction}
                          list="food-instructions"
                          placeholder="Food instruction"
                          onChange={(e) => handleRowChange(med.id, 'foodInstruction', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-semibold outline-hidden"
                        />
                      </td>

                      {/* Specific Remarks */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={med.remarks}
                          placeholder="e.g. Consume with honey"
                          onChange={(e) => handleRowChange(med.id, 'remarks', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-medium outline-hidden"
                        />
                      </td>

                      {/* Row Reordering & Control Actions */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Move up */}
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className={`p-1 rounded-md border transition-all ${
                              index === 0 
                                ? 'border-slate-100 text-slate-200 cursor-not-allowed' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                            title="Move Row Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move down */}
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === medicines.length - 1}
                            className={`p-1 rounded-md border transition-all ${
                              index === medicines.length - 1 
                                ? 'border-slate-100 text-slate-200 cursor-not-allowed' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                            title="Move Row Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(index)}
                            className="p-1.5 rounded-md border border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            title="Duplicate Row"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(med.id)}
                            className="p-1.5 rounded-md border border-slate-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Summary under table */}
        {medicines.length > 0 && (
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3 sm:gap-6 w-full sm:w-auto sm:min-w-[320px]">
              <div className="p-3 bg-white text-blue-600 rounded-xl shadow-xs">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subtotal Invoice Value</p>
                <p className="text-xl font-black text-slate-800">
                  INR {grandTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Nav Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('patient')}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Demographics</span>
        </button>

        <button
          onClick={handleNextStep}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/10 border border-blue-600"
        >
          <span>Compile PDF Documents</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
