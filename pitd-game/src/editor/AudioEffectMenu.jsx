import { useContext, useState } from "react";
import { EditorContext } from "./EditorContext";
import Multipicker from "./Multipicker";

export default function AudioEffectMenu({ 
    effect, 
    index, 
    count, 
    update,
    increase,
    decrease,
    remove
}) {
    const editorState = useContext(EditorContext);

    const upButtonClass = index === 0 ? 'disabled-btn' : '';
    const downButtonClass = index === count - 1 ? 'disabled-btn' : '';

    const handleTypeChange = (event) => {
        effect.setType(event.target.value);
        update(effect);
    }

    const handleParamChange = (param, event) => {
        effect.handleParamChange(param, event.target.value);
        update(effect);
    }

    const handleConditionChange = (event) => {
        update({
            ...effect,
            condition: event.target.value
        });
    }

    const rooms = editorState.rooms.map(room => ({
        id: room.id,
        name: room.name
    }));


    return <>
        <div className={"effect-menu " + (effect.type ? `fx-${effect.type}-bg` : '')}>
            <div className="effect-title">
                <select 
                    value={effect.type}
                    onChange={handleTypeChange}
                >
                    <option value="">--Select Type--</option>
                    <option value="gain">Gain</option>
                    <option value="filter">Filter</option>
                    <option value="reverb">Reverb</option>
                    <option value="delay">Delay</option>
                    <option value="chorus">Chorus</option>
                    <option value="distort">Distortion</option>
                    <option value="bitcrush">Bitcrusher</option>
                </select>
                
                <div className="effect-menu-action-btns btn-row">
                    <button onClick={() => increase(index)} className={upButtonClass}>⬆</button>
                    <button onClick={() => decrease(index)} className={downButtonClass}>⬇</button>
                    <button onClick={() => remove(index)}>Delete</button>
                </div>
            </div>
            <div className="effect-params">
                {Object.keys(effect.params).map(param => {
                    const val = effect.params[param];
                    const details = effect.paramDetails[param];

                    return (
                        <div className="effect-param">
                            <label className="modal-field-label">{details.label}</label>
                            {details.type === 'range' &&
                                <input 
                                    type="range"
                                    value={val}
                                    min={details.min}
                                    max={details.max}
                                    step={details.step}
                                    onChange={(event) => handleParamChange(param, event)}
                                />
                            }

                            {details.type === 'dropdown' && 
                                <select
                                    onChange={(event) => handleParamChange(param, event)}
                                    value={val} 
                                >
                                    {details.options.map(option => (
                                        <option value={option}>{option}</option>
                                    ))}
                                </select>
                            }
                        </div>
                    );
                })}
            </div>
            <div className="effect-conditions">
                <div className="modal-field">
                    <div className="modal-field-label">Condition</div>
                    <select value={effect.condition} onChange={handleConditionChange}>
                        <option value="always">Always On</option>
                        <option value="room">In Room(s)</option>
                        <option value="off">Off</option>
                    </select>
                </div>
            </div>
            {effect.condition === 'room' && 
                <Multipicker 
                    list={effect.rooms}
                    source={rooms}
                    setList={update}
                    title='Rooms'
                />
            }
        </div>
    </>;
}