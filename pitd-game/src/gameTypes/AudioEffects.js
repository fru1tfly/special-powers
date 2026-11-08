import { Tone } from "../gameData/assetManager";

const normalRange = {
    type: 'range',
    min: 0,
    max: 1,
    step: 0.01
}

const wetDry = {
    label: 'Wet/Dry',
    ...normalRange
}

const objectParams = [
    'delay.feedback',
    'delay.delayTime',
    'chorus.frequency',
    'filter.frequency',
    'filter.Q',
    'filter.gain',
    'filter.detune',
    'gain.gain'
];

export class AudioEffect {
    type = '';
    params = {};
    paramOptions = {};
    context;
    nodes = [];
    condition = '';
    rooms = [];

    handleParamChange = (param, value) => {
        const node = this.nodes[0];

        this.params = {
            ...this.params,
            [param]: value
        };

        if (objectParams.includes(`${this.type}.${param}`) || param === 'wet') {
            node[param].value = value;
        } else {
            node[param] = value;
        }

    }


    setType(newType, useDefaults = true) {
        const tone = Tone();
        this.type = newType;
        this.nodes.forEach(node => node.dispose());

        switch (newType) {
            case 'gain': {

                if (useDefaults) {
                    this.params = {
                        gain: 0
                    }
                }

                this.paramDetails = {
                    gain: {
                        label: 'Gain',
                        type: 'range',
                        min: -35,
                        max: 10,
                        step: 0.25
                    }
                }

                const node = new tone.Gain(this.params.gain, "decibels");
                this.nodes = [node];
                break;
            }

            case 'reverb': {
                if (useDefaults) {
                    this.params = {
                        decay: 1.5,
                        preDelay: 0,
                        wet: 0.5
                    }
                }

                this.paramDetails = {
                    decay: {
                        label: 'Decay',
                        type: 'range',
                        min: 0.5,
                        max: 100,
                        step: 0.5
                    },

                    preDelay: {
                        label: 'Offset',
                        type: 'range',
                        min: 0, 
                        max: 3,
                        step: 0.15
                    },

                    wet: wetDry
                }

                const node = new tone.Reverb(this.params);
                this.nodes = [node];
                break;
            }

            case 'distort': {
                if (useDefaults) {
                    this.params = {
                        distortion: 0.5,
                        oversample: '2x',
                        wet: 0.5
                    }
                }

                this.paramDetails = {
                    distortion: {
                        label: 'Distortion',
                        ...normalRange
                    },

                    oversample: {
                        label: 'Oversample',
                        type: 'dropdown',
                        options: ['none', '2x', '4x']
                    },

                    wet: wetDry
                }

                const node = new tone.Distortion(this.params);
                this.nodes = [node];
                break;
            }

            case 'bitcrush': {
                if (useDefaults) {
                    this.params = {
                        bits: 3,
                        wet: 0.5
                    }
                }

                this.paramDetails = {
                    bits: {
                        label: 'Downsample',
                        type: 'range',
                        min: 1,
                        max: 8,
                        step: 0.15
                    },

                    wet: wetDry
                }

                const node = new tone.BitCrusher(this.params);
                this.nodes = [node];
                break;
            }

            case 'delay': {
                if (useDefaults) {
                    this.params = {
                        delayTime: 0.1,
                        feedback: 0.2,
                        wet: 0.5
                    }
                }

                this.paramDetails = {
                    delayTime: {
                        label: 'Time',
                        ...normalRange
                    },
                    feedback: {
                        label: 'Feedback',
                        ...normalRange
                    },
                    wet: wetDry
                }

                const node = new tone.FeedbackDelay(this.params);
                this.nodes = [node];
                break;
            }

            case 'chorus': {
                if (useDefaults) {
                    this.params = {
                        frequency: 500,
                        delayTime: 20,
                        depth: 0.3,
                        spread: 30,
                        wet: 0.5
                    }
                }

                this.paramDetails = {
                    frequency: {
                        label: 'Frequency',
                        type: 'range',
                        min: 20,
                        max: 4000,
                        step: 10
                    },

                    delayTime: {
                        label: 'Delay',
                        type: 'range',
                        min: 0,
                        max: 2000,
                        step: 5
                    },

                    depth: {
                        label: 'Depth',
                        ...normalRange
                    },

                    spread: {
                        label: 'Stereo Width',
                        type: 'range',
                        min: 0,
                        max: 180,
                        step: 1
                    },

                    wet: wetDry
                }

                const node = new tone.Chorus(this.params);
                this.nodes = [node];
                break;
            }

            case 'filter': {
                if (useDefaults) {
                    this.params = {
                        frequency: 3000,
                        type: 'lowpass',
                        rolloff: -12,
                        Q: 1,
                        gain: 0,
                        detune: 0
                    }
                }

                this.paramDetails = {
                    frequency: {
                        label: 'Frequency',
                        type: 'range',
                        min: 20,
                        max: 4000,
                        step: 10
                    },
                    type: {
                        label: 'Type',
                        type: 'dropdown',
                        options: [
                            'lowpass',
                            'highpass',
                            'bandpass',
                            'lowshelf',
                            'highshelf',
                            'notch',
                            'allpass',
                            'peaking'
                        ]
                    },
                    rolloff: {
                        label: 'Rolloff (dB)',
                        type: 'dropdown',
                        options: [-12, -24, -48]
                    },
                    Q: {
                        label: 'Q',
                        type: 'range',
                        min: 0.01,
                        max: 3,
                        step: 0.05
                    },
                    gain: {
                        label: 'Gain',
                        type: 'range',
                        min: 0,
                        max: 4,
                        step: 0.1
                    },
                    detune: {
                        label: 'Detune',
                        type: 'range',
                        min: -100,
                        max: 100,
                        step: 1
                    }
                }

                const node = new tone.Filter(this.params);
                this.nodes = [node];
                break;
            }
        }
    }


}