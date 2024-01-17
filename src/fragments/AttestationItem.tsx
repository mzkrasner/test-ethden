import { useState } from "react";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import dayjs from "dayjs";
import { ethers } from "ethers";
import { MdOutlineVerified, MdVerified } from "react-icons/md";
// import { Identicon } from "./Identicon";
import { theme } from "../../utils/theme";
import { ResolvedAttestation } from "../../utils/types";
import {
  CUSTOM_SCHEMAS,
  EASContractAddress,
  baseURL,
  timeFormatString,
} from "../../utils/utils";


export function AttestationItem({ data }: any) {
  const address = data.recipient;
  const [confirming, setConfirming] = useState(false);

  if (!address) return null;

  let Icon = MdVerified;

  console.log(data);
  return (
    <div
      className="AttestContainer"
      style={{marginTop: "1rem", marginBottom: "1rem", padding: "1rem", borderRadius: "1rem", border: "1px solid #eaeaea"}}
    >
      <div className="IconHolder">
        {/* <Identicon
          address={isAttester ? data.recipient : data.attester}
          size={60}
        /> */}
      </div>
      <div className="NameHolder">
       <p>Attendee:</p> 
       <p style={{fontWeight: "lighter"}}>{data.recipient}</p>
      </div>
      <div className="NameHolder">
       <p>Location:</p> 
       <p style={{fontWeight: "lighter"}}>Longitude: {data.longitude}</p>
       <p style={{fontWeight: "lighter"}}>Latitude: {data.latitude}</p>
      </div>
      <div className="Time">
      <p>Time:</p> 
        {data.timestamp.toString()}
      </div>
      <div className="Check">
      </div>
    </div>
  );
}
