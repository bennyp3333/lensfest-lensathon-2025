import { Event } from "./Event";

export class Watcher<T> {

    onUpdate: Event = new Event();

    protected data: T = null;

    protected _comparator: (data: T) => boolean;

    constructor(private readonly getter: () => T) {
        this._comparator = (value: T) => this.data === value;
    }

    getData(): T {
        return this.data;
    }

    update(): boolean {
        const updatedData: T = this.getter();
        if (!this._comparator(updatedData)) {
            this.data = updatedData;
            this.onUpdate.trigger();
            return true;
        }
        return false;
    }
}
