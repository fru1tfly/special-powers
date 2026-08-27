import { EditorContext, SetEditorContext } from "./EditorContext";
import { useContext, useEffect, useState, useSyncExternalStore } from "react";
import { interactableFormValues } from "../gameData/Interactables";
import { useUploadFile } from "../hooks/files/useUploadFile";
import { startShapeMode, shapeModeSubscribe, getShapeMode, cameraOffset, startMoveMode, moveModeSubscribe, getMoveMode, on } from "./EditorInputHandler";
import { useGetInteractable, useUpdateInteractable } from "../hooks/editor/InteractableHelper";
import { Vector2 } from "../gameTypes/Vector";
import { addImage } from "../gameData/images";

const TYPES = [
    '--None--',
    'Art',
    'Door',
    'Key'
]

export default function EditorModal() {
    const editorState = useContext(EditorContext);
    const setEditorState = useContext(SetEditorContext);

    const shapeMode = useSyncExternalStore(shapeModeSubscribe, getShapeMode);
    const moveMode = useSyncExternalStore(moveModeSubscribe, getMoveMode);

    const { uploadFile } = useUploadFile();

    const selectedInteractable = useGetInteractable();
    const updateInteractable = useUpdateInteractable();

    const onShapeAdd = shape => {
        updateInteractable({
            ...selectedInteractable,
            points: [...shape]
        });
    };

    const onMoveItem = newPosition => {
        updateInteractable({
            ...selectedInteractable,
            points: [newPosition]
        });
    };

    useEffect(() => {
        const removeShapeAdd = on('shapeAdd', onShapeAdd);
        const removeMoveItem = on('moveItem', onMoveItem);

        return () => {
            removeShapeAdd();
            removeMoveItem();
        }
    }, [selectedInteractable, updateInteractable]);


    const handleNameChange = (event) => {
        updateInteractable({
            ...selectedInteractable,
            name: event.target.value
        })
    }

    const handleTypeChange = (event) => {
        const oldType = selectedInteractable.objectType;

        if (oldType) {
            const oldFields = interactableFormValues[oldType];
            Object.keys(oldFields).forEach(f => delete selectedInteractable[f]);
        }
        updateInteractable({
            ...selectedInteractable,
            objectType: event.target.value
        })
    }

    const handleFormValueChange = (varName, event) => {
        if (event.target.checked !== undefined) { 
            updateInteractable({
                ...selectedInteractable,
                [varName]: event.target.checked
            })
        } else {
            updateInteractable({
                ...selectedInteractable,
                [varName]: event.target.value
            })
        }
    }

    const getOptions = (optionType, formValue) => {
        switch (optionType) {
            case 'rooms': {
                
                return [
                    (<option>--Select--</option>),
                    editorState.rooms.map(room => {
                        if (room.id === editorState.selectedRoom) return null;

                        const opts = {};
                        if (selectedInteractable[formValue] === room.id) {
                            opts['selected'] = 'selected';
                        }

                        return (<option {...opts} value={room.id}>{room.name}</option>)
                    }).filter(op => op !== null)
                ]
            }
            case 'keys': {
                return [
                    (<option>--Select--</option>),
                    editorState.rooms.reduce((keys, room) => {
                        room.interactables.forEach(int => {
                            if (int.objectType === 'Key') {
                                keys = [...keys, int];
                            }
                        });

                        return keys;
                    }, []).map(key => {
                        const opts = {};
                        if (selectedInteractable[formValue] === key.id) {
                            opts['selected'] = 'selected';
                        }

                        return (<option {...opts} value={key.id}>{key.name}</option>)
                    })
                ];
            }
        }
    }

    const uploadSprite = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        uploadFile(file, '/images/sprites').then(async response => {
            const imgUrl = response;

            await addImage(imgUrl);

            updateInteractable({
                ...selectedInteractable,
                assets: [imgUrl]
            });
        });
    }

    const uploadMulti = async (event) => {
        const files = Array.from(event.target.files);

        const newUrls = await Promise.all(files.map(file => uploadFile(file, '/images/sprites')))
        updateInteractable({
            ...selectedInteractable,
            assets: [ 
                ...selectedInteractable.assets,
                ...newUrls
            ]
        });
    }

    const deletePhoto = (img) => {
        updateInteractable({
            ...selectedInteractable,
            assets: selectedInteractable.assets.filter(i => i !== img)
        });
    }

    const startWorldEdit = () => {
        if (selectedInteractable.objectType !== 'Key') {
            updateInteractable({
                ...selectedInteractable,
                points: []
            });

            startShapeMode();
        } else {
            let point = selectedInteractable.points.length > 0 
                ? selectedInteractable.points[0] 
                : new Vector2(-cameraOffset.x, -cameraOffset.y);

            if (selectedInteractable.points.length === 0) {
                updateInteractable({
                    ...selectedInteractable,
                    points: [point]
                });
            }

            startMoveMode(selectedInteractable.id, point, selectedInteractable.assets[0]);
        }

    }

    let worldEditText = 'Draw Area';
    if (selectedInteractable.objectType !== 'Key') {
        if (selectedInteractable.points.length > 0) {
            worldEditText = 'Redraw Area';
        }
    } else {
        if (selectedInteractable.points.length > 0) {
            worldEditText = 'Edit Position';
        } else {
            worldEditText = 'Set Position';
        }
    }

    function deselectInteractable() {
        setEditorState({
            ...editorState,
            selectedInteractable: null
        })
    }

    const deleteSelected = () => {
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.map(r => {
                if (r.id === editorState.selectedRoom) {
                    r.interactables = r.interactables.filter(i => i.id !== editorState.selectedInteractable)
                }
                return r;
            }),
            selectedInteractable: null
        })
    }

    return shapeMode ? (
        <div className="help-text">
            <div className="help-text-item">
                <span className="control-icon"><img src={`${import.meta.env.BASE_URL}mouse.png`}/></span>
                <span className="instruction-text">Place New Vertex</span>
            </div>
            <div className="help-text-item">
                <span className="key-control">Esc</span>
                <span className="instruction-text">Cancel</span>
            </div>
            <div className="help-text-item">
                <span className="key-control">Enter</span>
                <span className="instruction-text">Complete Shape</span>
            </div>
            
        </div>
    ) : moveMode ? (
        <div className="help-text">
            <div className="help-text-item">
                <span className="control-icon"><img src={`${import.meta.env.BASE_URL}mouse.png`}/></span>
                <span className="instruction-text">Move Item</span>
            </div>
            <div className="help-text-item">
                <span className="key-control">Esc</span>
                <span className="instruction-text">Cancel</span>
            </div>
            <div className="help-text-item">
                <span className="key-control">Enter</span>
                <span className="instruction-text">Done</span>
            </div>
        </div>
    ) : (
        <div className="editor-modal">
            <div className="modal-body">
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Name</div>
                        <input type="text" value={selectedInteractable.name} onInput={handleNameChange}/>
                    </div>
                    <div className="modal-field">
                        <div className="modal-field-label">Type</div>
                        <select onChange={handleTypeChange} value={selectedInteractable.objectType}>
                            {TYPES.map(t => { 
                                return (<option key={t}>{t}</option>); 
                            })}
                        </select>
                    </div>
                    {
                        selectedInteractable.objectType && Object.keys(interactableFormValues[selectedInteractable.objectType]).map(formValue => {
                            const def = interactableFormValues[selectedInteractable.objectType][formValue];
                            const opts = {};
                            if (def.type === 'checkbox' && selectedInteractable[formValue]) {
                                opts['checked'] = 'checked';
                            }

                            if (def.visible && !selectedInteractable[def.visible]) {
                                return <></>;
                            }

                            return (
                                <div key={formValue} className="modal-field">
                                    <div className="modal-field-label">{def.name}</div>
                                    {def.type === 'dropdown' && (
                                        <select onChange={(event) => handleFormValueChange(formValue, event)}>
                                            {getOptions(def.options, formValue)}
                                        </select>
                                    )}
                                    {def.type === 'checkbox' && (
                                        <div>
                                            <input type="checkbox" {...opts} onChange={(event) => handleFormValueChange(formValue, event)}/>
                                        </div>
                                    )}
                                    {def.type === 'photo' && selectedInteractable.assets.length === 0 && (
                                        <>
                                            <label htmlFor="sprite" className="uploadLabel">Add Photo</label>
                                            <input type="file" accept="image/*" onChange={uploadSprite} id="sprite" />
                                        </>
                                    )}
                                    {def.type === 'photo' && selectedInteractable.assets.length === 1 && (
                                        <>
                                            <div className="form-image-container">
                                                <img className="form-image" src={ `${import.meta.env.VITE_DOMAIN}${selectedInteractable.assets[0]}`} />
                                            </div>
                                            <label htmlFor="sprite" className="uploadLabel">Swap Photo</label>
                                            <input type="file" accept="image/*" onChange={uploadSprite} id="sprite" />
                                        </>
                                    )}
                                    {def.type === 'multi photo' && (
                                        <>
                                            <div className="multi-image-container">
                                                {selectedInteractable.assets.map(img => (
                                                     <div className="form-image-container">
                                                        <img className="form-image" src={`${import.meta.env.VITE_DOMAIN}${img}`} />
                                                        <button className="form-image-delete-btn" onClick={() => deletePhoto(img)}>X</button>
                                                    </div>
                                                ))}
                                            </div>
                                            <label htmlFor="sprite" className="uploadLabel">Add Photos</label>
                                            <input type="file" accept="image/*" onChange={uploadMulti} id="sprite" multiple />
                                        </>
                                    )}
                                </div>
                            )
                        })
                    }
                </div>
            </div>
            <div className="modal-footer">
                {selectedInteractable.objectType && (selectedInteractable.objectType !== 'Key' || selectedInteractable.assets.length > 0) && (
                    <button className="modal-footer-button" onClick={startWorldEdit}>
                        {worldEditText}
                    </button>
                )}
                <button className="modal-footer-button" onClick={deleteSelected}>Delete</button>
                <button className="modal-footer-button action-btn" onClick={deselectInteractable}>Done</button>
            </div>
        </div>
    );
}