export abstract class StrapiContentType<T> {
    apiId: string
    data: T

    constructor(apiId: string, data: T) {
        this.apiId = apiId;
        this.data = data;
    }

    getSingularName(): string {
        return this.apiId
    }

    getPluralName(): string {
        return `${this.apiId}s`
    }

    getData(): T {
        return this.data
    }
}