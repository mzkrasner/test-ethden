import { CeramicClient } from "@ceramicnetwork/http-client";
import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { NextApiRequest, NextApiResponse } from "next";
import { fromString } from "uint8arrays/from-string";
import { definition } from "../../__generated__/definition.js";

const uniqueKey = process.env.SECRET_KEY;

export default async function createCredential(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { location, recipient, event } = req.body;

  try {
    if (uniqueKey) {
      const key = fromString(uniqueKey, "base16");
      const provider = new Ed25519Provider(key);
      const resolved = KeyResolver.getResolver();
      const staticDid = new DID({
        // @ts-ignore
        resolver: KeyResolver.getResolver(),
        provider,
      });

      await staticDid.authenticate();
      const badge = {
        recipient: recipient.toLowerCase(),
        event: event,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
      };

      const jws = await staticDid.createDagJWS(badge);
      const jwsJsonStr = JSON.stringify(jws);
      const jwsJsonB64 = Buffer.from(jwsJsonStr).toString("base64");
      const completeBadge = {
        ...badge,
        jwt: jwsJsonB64,
      };
      return res.json(completeBadge);
    }
  } catch (err) {
    res.json({
      err,
    });
  }
}
