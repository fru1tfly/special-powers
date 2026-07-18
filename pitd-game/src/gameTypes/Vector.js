export class Vector2 {
    x;
    y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    plus(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    minus(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    times(s) {
        return new Vector2(this.x * s, this.y * s);
    }
}   