import { useGetInteractable, useUpdateInteractable } from "./InteractableHelper";

export function useAddShape() {
    const selectedInteractable = useGetInteractable();
    const updateInteractable = useUpdateInteractable();
    
    const addShape = (newNodes) => {
        updateInteractable({
            ...selectedInteractable,
            points: [...newNodes]
        })
    };

    return addShape;
}