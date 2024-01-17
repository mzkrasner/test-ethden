"use client";
import React, { useEffect, useState } from "react";
import { networks } from "../../utils/networks";
import { AttestationItem } from "../fragments/AttestationItem";
import { QRCodeSVG } from "qrcode.react";
import { useAccount } from "wagmi";
import { useComposeDB } from "../fragments";
import { get } from "http";

export default function Home() {
  const [account, setAccount] = useState("");
  const [network, setNetwork] = useState("");
  const { address, isDisconnected } = useAccount();
  const { compose } = useComposeDB();
  const [attestations, setAttestations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getBadges = async () => {
    setLoading(true);
    const badges: any = await compose.executeQuery<{
      ethDen24AttendanceList: {
        edges: {
          node: {
            recipient: string;
            controller: {
              id: string;
            };
            latitude: number;
            longitude: number;
            timestamp: number;
            jwt: string;
          };
        };
      };
    }>(
      `query {
        viewer {
        ethDen24AttendanceList(last: 2){
          edges{
            node{
              recipient
              controller {
                id
              }
              latitude
              longitude
              timestamp
              jwt
            }
          }
        }
       }
      }`
    );
    console.log(badges);
    const records: any[] = [];
    if (badges.data && badges.data.viewer !== null) {
      badges.data.viewer.ethDen24AttendanceList.edges.forEach((att: any) => {
        const item = att.node;
        records.push(item);
      });
      setAttestations([...attestations, ...records]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (address) {
      getBadges();
    }
  }, [address]);

  return (
    <>
      <div className="flex h-screen w-screen flex-col">
        <div className="m-auto w-1/2 h-1/2">
          <div className="Container">
            {address && address.length && (
              <div className="right">
                <img alt="Network logo" className="logo" src={"/ethlogo.png"} />
                <p style={{ textAlign: "center" }}>
                  {" "}
                  Connected with: {address.slice(0, 6)}...{address.slice(-4)}{" "}
                </p>
              </div>
            )}
            <div className="GradientBar" />

            <div className="NewConnection">Attendance Badges</div>
            <div className="AttestationHolder">
              <div className="WhiteBox">
                {loading && <div>Loading...</div>}
          
                {attestations.length > 0 ? (
                  attestations.map((attestation, i) => (
                    <AttestationItem key={i} data={attestation} />
                  ))
                ) : (
                  <div></div>
                )}
                <QRCodeSVG
                  style={{ margin: "auto" }}
                  value={`https://main--rad-daifuku-f4c924.netlify.app/?event=kjzl6hvfrbw6c59nb0ycy2n47zp5swmcmuenf8wdaompnp7nvbuqijzopa5uq8x`}
                  includeMargin={true}
                  size={300}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
