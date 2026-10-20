import { useContext, useRef, useState, useEffect } from "react";
import { Fade } from "../../gameTypes/LevelObjects";
import { EditorContext, SetEditorContext } from "../EditorContext";
import { useGetInteractable, useUpdateInteractable } from "../../hooks/editor/InteractableHelper";
import FadeBlock from "../../common/FadeBlock";

export default function FadeModal({ fadeField, closeModal }) {
    const editorState = useContext(EditorContext);
    const setEditorState = useContext(SetEditorContext);

    const selectedInteractable = useGetInteractable();
    const updateInteractable = useUpdateInteractable();
    const existingFade = selectedInteractable[fadeField];

    const [steps, setSteps] = useState(existingFade?.steps ?? 5);
    const [fps, setFps] = useState(existingFade?.fps ?? 3);
    const [stall, setStall] = useState(existingFade?.stall ?? 4);
    const [color, setColor] = useState(existingFade?.color ?? '#000');
    const [previewing, setPreviewing] = useState(false);

   

    const fade = useRef(new Fade()).current;
    fade.steps = steps;
    fade.fps = fps;
    fade.stall = stall;
    fade.color = color;

    useEffect(() => {
    
        const unsubscribe = fade.on('end', () => {
            setPreviewing(false);
        });

        return unsubscribe;
    }, [fade]);

    const handleStepChange = (event) => {
        setSteps(event.target.value);
    }

    const handleFpsChange = (event) => {
        setFps(event.target.value);
    }

    const handleStallChange = (event) => {
        setStall(event.target.value);
    }

    const handleColorChange = (event) => {
        setColor(event.target.value);
    }

    const handlePreview = () => {
        fade.initialize();
        setPreviewing(true);
    }

    const saveFade = () => {
        updateInteractable({
            ...selectedInteractable,
            [fadeField]: fade.getDefinition()
        });
        closeModal();
    }

    return  (
        <div className="editor-modal">
            <div className="modal-body">
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Steps</div>
                        <input type="number" value={steps} onInput={handleStepChange}/>
                    </div>
                    <div className="modal-field">
                        <div className="modal-field-label">FPS</div>
                        <input type="number" value={fps} onInput={handleFpsChange}/>
                    </div>
                </div>
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Stall</div>
                        <input type="number" value={stall} onInput={handleStallChange}/>
                    </div>
                    <div className="modal-field">
                        <div className="modal-field-label">Color</div>
                        <input type="color" value={color} onChange={handleColorChange}/>
                    </div>
                </div>
            </div>
            <div className="modal-footer">
                <button className="modal-footer-button" onClick={handlePreview}>Preview</button>
                <button className="modal-footer-button action-btn" onClick={saveFade}>Done</button>
            </div>
            <FadeBlock fade={fade} playing={previewing} />
        </div>
    );
}