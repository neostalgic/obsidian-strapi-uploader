import { StrapiContentType } from "./strapi-content-type";

interface ReganShanerComBlogPostModel {
    Title: string;
    Date: string;
    Body: string;
}

export class ReganShanerComBlogPost extends StrapiContentType<ReganShanerComBlogPostModel> {
    constructor(data: ReganShanerComBlogPostModel) {
        super("blog-reganshaner-com-post", data);
    }
}