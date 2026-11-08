import { useState } from 'react';

export default function Multipicker({ list, source, setList, title }) {

    const [excludedSelected, setExcludedSelected] = useState([]);
    const [includedSelected, setIncludedSelected] = useState([]);

    const excluded = source.filter(r => !list.includes(r.id));
    const included = source.filter(r => list.includes(r.id));

    const handleExcludedSelect = (event) => {
        const options = Array.from(event.target.options);
    
        const values = options
            .filter(option => option.selected)
            .map(option => option.value);

        setExcludedSelected(values);
    }

    const handleIncludedSelect = (event) => {
        const options = Array.from(event.target.options);
    
        const values = options
            .filter(option => option.selected)
            .map(option => option.value);

        setIncludedSelected(values);
    }

    const handleAdd = () => {
        setList([
            ...list,
            ...excludedSelected
        ]);

        setExcludedSelected([]);
    }

    const handleRemove= () => {
        setList(list.filter(r => !includedSelected.includes(r)))
        setIncludedSelected([]);
    }

    const addButtonClass= excludedSelected.length === 0 ? 'disabled-btn' : '';
    const removeButtonClass= includedSelected.length === 0 ? 'disabled-btn' : '';

    return (
        <div className="modal-field">
            <div className="modal-field-label">{title}</div>
            <div className="multipick-container">
                <div className="multipick-section">
                    <select 
                        className="multipick-select multipick-negative" 
                        multiple
                        onChange={handleExcludedSelect}
                        value={excludedSelected}
                    >
                        <option disabled className="multipick-item">Excluded</option>
                        {excluded.map(r => <option key={r.id} className="multipick-item" value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div className="multipick-buttons">
                    <button onClick={handleAdd} className={addButtonClass}>&gt;</button>
                    <button onClick={handleRemove} className={removeButtonClass}>&lt;</button>
                </div>
                <div className="multipick-section">
                    <select 
                        className="multipick-select multipick-positive" 
                        multiple
                        onChange={handleIncludedSelect}
                        value={includedSelected}
                    >
                        <option disabled className="multipick-item">Included</option>
                        {included.map(r => <option key={r.id} className="multipick-item" value={r.id}>{r.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}