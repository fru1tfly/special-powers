export const interactableFormValues = {
    '--None--': {},
    Door: {
        hasArea: true,
        hasPosition: false,
        destination: {
            name: 'Destination',
            type: 'dropdown',
            options: 'rooms'
        },
        isLocked: {
            name: 'Locked?',
            type: 'checkbox'
        },
        
        transitionType: {
            name: 'Transition Type',
            type: 'dropdown',
            options: 'transitionTypes'
        },

        transitionFrames: {
            name: 'Transition',
            type: 'animation',
            visibleFunc: (val) => val === 'sprites',
            visible: 'transitionType'
        },

        transitionFade: {
            name: 'Transition',
            type: 'fade',
            visibleFunc: (val) => val === 'fade',
            visible: 'transitionType'
        },
        
        key: {
            name: 'Key',
            visible: 'isLocked',
            type: 'dropdown',
            options: 'keys'
        },

        openSound: {
            name: 'Open Sound',
            type: 'sound'
        },

        lockedSound: {
            name: 'Locked Sound',
            type: 'sound',
            visible: 'isLocked'
        }
    },
    MovePoint: {
        hasArea: true,
        hasPosition: false,
        destination: {
            name: 'Destination',
            type: 'dropdown',
            options: 'rooms'
        },
        
        icon: {
            name: 'Icon',
            type: 'dropdown',
            options: 'cursors'
        },
        
        transitionType: {
            name: 'Transition Type',
            type: 'dropdown',
            options: 'transitionTypes'
        },

        transitionFrames: {
            name: 'Transition',
            type: 'animation',
            visibleFunc: (val) => val === 'sprites',
            visible: 'transitionType'
        },

        transitionFade: {
            name: 'Transition',
            type: 'fade',
            visibleFunc: (val) => val === 'fade',
            visible: 'transitionType'
        },

        moveSound: {
            name: 'Move Sound',
            type: 'sound'
        }
    },
    Key: {
        hasArea: false,
        hasPosition: true,
        sprite: {
            name: 'Sprite',
            type: 'photo'
        },

        pickupSound: {
            name: 'Pickup Sound',
            type: 'sound'
        }
    },
    Art: {
        hasArea: true,
        hasPosition: false,
        closeUp: {
            name: 'Close Up',
            type: 'photo'
        },

        viewSound: {
            name: 'View Sound',
            type: 'sound'
        }
    },

    AudioPlayer: {
        hasArea: true,
        hasPosition: false,
        audio: {
            name: 'Audio',
            type: 'sound'
        }
    },

    AnimatedObject: {
        hasArea: false,
        hasPosition: true,
        frames: {
            name: 'Frames',
            type: 'animation'
        }
    },
    Background: {
        hasArea: false,
        hasPosition: false,
        frames: {
            name: 'Frames',
            type: 'animation'
        }
    }
};

export const hasArea = (objectType) => {
    return interactableFormValues[objectType]?.hasArea ?? false;
}

export const hasPosition = (objectType) => {
    return interactableFormValues[objectType]?.hasPosition ?? false;
}