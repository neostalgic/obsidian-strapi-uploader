import { StrapiContentType } from "./strapi-content-type";

interface NeostalgiaIoBlogPostModel {
    title: string;
    date: string;
    body: string;
}

export class NeostalgiaIoBlogPost extends StrapiContentType<NeostalgiaIoBlogPostModel> {
    constructor(data: NeostalgiaIoBlogPostModel) {
        super("neostalgia-io-blog-post", data);
    }
}