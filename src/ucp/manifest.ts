import { UCPManifest } from "./types";
import manifestJson from "../../ucp.json";

export const MULTIVERSX_UCP_MANIFEST: UCPManifest = manifestJson as unknown as UCPManifest;
