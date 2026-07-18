export const interactableFormValues = {
    '--None--': {},
    Door: {
        destination: {
            name: 'Destination',
            type: 'dropdown',
            options: 'rooms'
        },
        isLocked: {
            name: 'Locked?',
            type: 'checkbox'
        },
        key: {
            name: 'Key',
            visible: 'isLocked',
            type: 'dropdown',
            options: 'keys'
        },
        transitionFrames: {
            name: 'Transition Frames',
            type: 'multi photo'
        }
    },
    Key: {
        sprite: {
            name: 'Sprite',
            type: 'photo'
        }
    },
    Art: {
        closeUp: {
            name: 'Close Up',
            type: 'photo'
        }
    }
};