import "server-only";
import {getStore} from "@netlify/blobs";

const store = () => getStore("product-photos", {consistency: "strong"});
export const imageBucket = {
  async put(key: string, bytes: Uint8Array, options: {httpMetadata: {contentType: string}}) {
    await store().set(key, Uint8Array.from(bytes).buffer, {metadata: {contentType: options.httpMetadata.contentType}});
  },
  async get(key: string) {
    const file = await store().getWithMetadata(key, {type: "arrayBuffer"});
    if (!file) return null;
    return {body: file.data, httpMetadata: {contentType: String(file.metadata.contentType ?? "image/jpeg")}};
  },
  async delete(key: string) {await store().delete(key);}
};
export type ImageBucket = typeof imageBucket;
