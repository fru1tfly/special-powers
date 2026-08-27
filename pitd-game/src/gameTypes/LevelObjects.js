
export class LevelObject {
    name
    id

    constructor() {
        this.id = crypto.randomUUID()
    }
}

export class Room extends LevelObject {
    interactables = []
    imgUrl

    constructor() {
        super()
        this.name = 'New Room'
    }
}

export class Interactable extends LevelObject {
    points = [];
    objectType;
    definition;
    assets = [];
    auxAssets = [];

    constructor(definition) {
        super();
        this.name = 'New Interactable';
        this.definition = definition;
    }
}

export class Feature extends LevelObject {
    init() {
    }

    handleMouseMove(x, y, mouse) {
    }

    handleMouseDown(x, y) {
    }
}
