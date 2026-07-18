import { useContext } from "react";
import { EditorContext, SetEditorContext } from "../../editor/EditorContext";

export function useGetInteractable() {
    const editorState = useContext(EditorContext);

    const selectedInteractable = editorState
        .rooms.find(r => r.id === editorState.selectedRoom)
        .interactables.find(i => i.id === editorState.selectedInteractable);

    return selectedInteractable;
}

export function useUpdateInteractable() {
    const editorState = useContext(EditorContext);
    const setEditorState = useContext(SetEditorContext);

    const updateInteractable = (newSelected) => {
        setEditorState({
            ...editorState,
            rooms: [ 
                ...editorState.rooms.map(room => {
                    if (room.id === editorState.selectedRoom) {
                        return {
                            ...room,
                            interactables: [
                                ...room.interactables.map(int => {
                                    if (int.id === editorState.selectedInteractable) {
                                        return { ...newSelected };
                                    }
                                    return int;
                                })
                            ]
                        }
                    }
                    return room;
                }),
            ]
        })
    };

    return updateInteractable;
}