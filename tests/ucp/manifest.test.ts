
import Fastify from "fastify";
import { createHttpServer } from "../../src/http";
import request from "supertest";
import { UCPManifestSchema } from "../../src/ucp/schemas";

describe("UCP Manifest", () => {
    let fastify: any;

    beforeAll(async () => {
        fastify = createHttpServer();
        await fastify.ready();
    });

    afterAll(() => {
        fastify.close();
    });

    it("should serve a valid UCP manifest at /.well-known/ucp", async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/.well-known/ucp'
        });

        expect(response.statusCode).toBe(200);
        const manifest = JSON.parse(response.payload);

        // VALIDATE AGAINST SCHEMA
        const validation = UCPManifestSchema.safeParse(manifest);
        if (!validation.success) {
            console.error(JSON.stringify(validation.error.format(), null, 2));
        }
        expect(validation.success).toBe(true);

        // CHECK SPECIFIC CAPABILITIES
        expect(manifest.capabilities["dev.ucp.discovery"]).toBeDefined();
        expect(manifest.capabilities["dev.ucp.identity"]).toBeDefined();

        // Verify Content-Type
        expect(response.headers['content-type']).toContain('application/json');
    });
});
