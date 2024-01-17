"use client";
import React, { useEffect, useState } from "react";
import { networks } from "../../utils/networks";
import { AttestationItem } from "../fragments/AttestationItem";
import { ResolvedAttestation } from "../../utils/types";
import { useAccount } from "wagmi";
import { useComposeDB } from "../fragments";
import { get } from "http";

export default function Home() {
  const { address, isDisconnected } = useAccount();
  const { compose, isAuthenticated } = useComposeDB();
  const [attestations, setAttestations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getBadges = async () => {
    setLoading(true);
    try {
      const badges: any = await compose.executeQuery<{
        viewer: {
          ethDen24AttendanceList: {
            edges: {
              node: ResolvedAttestation;
            }[];
          };
        };
      }>(
        `query{
        viewer{
          ethDen24AttendanceList(last: 2){
            edges{
              node{
                controller{
                  id
                }
                recipient
                latitude 
                longitude
                timestamp
                jwt
              }
            }
          }
        }
      }
      `
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
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      getBadges();
    }
  }, [isAuthenticated]);

  return (
    <>
      <div className="flex h-screen w-screen flex-col">
        <div className="m-auto ">
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
                {!loading && !attestations.length && <div>Nothing here</div>}
                {attestations.length > 0 ? (
                  attestations.map((attestation, i) => (
                    <AttestationItem key={i} data={attestation} />
                  ))
                ) : (
                  <div></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
