import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { GraphiQL } from "graphiql";
import Link from "next/link";
import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { definition } from "../__generated__/definition.js";
import { useComposeDB } from "../fragments";

import "graphiql/graphiql.min.css";

enum ClaimTypes {
  verifiableCredential = "verifiableCredential",
  attestation = "attestation",
}

type Queries = {
  values: [{ query: string }, { query: string }];
};

type Location = {
  latitude: number;
  longitude: number;
};

export default function Attest() {
  const [attesting, setAttesting] = useState(false);
  const { compose } = useComposeDB();
  const [claim, setClaim] = useState<ClaimTypes>(ClaimTypes.attestation);
  const [signature, setSignature] = useState<"EIP712" | "JWT">("EIP712");
  const [event, setEvent] = useState<"RepConnect" | "DePin" | "">("");
  const [userLocation, setUserLocation] = useState<Location>();
  const [loggedIn, setLoggedIn] = useState(false);
  const { address, isDisconnected } = useAccount();

  const getUserLocation = () => {
    // if geolocation is supported by the users browser
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      console.log("Geolocation not supported");
    }

    function success(position: any) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      console.log(position.coords);
      setUserLocation({ latitude, longitude });
      console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
      console.log(typeof latitude);
    }

    function error() {
      console.log("Unable to retrieve your location");
    }
  };

  const createBadge = async () => {
    const result = await fetch("/api/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: address,
        event,
        location: userLocation,
      }),
    });
    const finalClaim = await result.json();
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const eventItem = urlParams.get("event");
    console.log(eventItem);
    const data =
      eventItem ===
      "kjzl6hvfrbw6c7h89i4guper7x19w3d9vvuulhmq89sg02z9wcfsnt5gvurzdqn"
        ? await compose.executeQuery(`
    mutation{
      createEthDen24RepCon(input: {
        content: {
          recipient: "${finalClaim.recipient}"
          latitude: ${finalClaim.latitude}
          longitude: ${finalClaim.longitude}
          timestamp: "${finalClaim.timestamp}"
          jwt: "${finalClaim.jwt}"
        }
      })
      {
        document{
          id
          recipient
          latitude
          longitude
          timestamp
          jwt
        }
      }
    }
  `)
        : eventItem ===
          "kjzl6hvfrbw6c59nb0ycy2n47zp5swmcmuenf8wdaompnp7nvbuqijzopa5uq8x"
        ? await compose.executeQuery(`
  mutation{
    createEthDen24DePin(input: {
      content: {
        recipient: "${finalClaim.recipient}"
        latitude: ${finalClaim.latitude}
        longitude: ${finalClaim.longitude}
        timestamp: "${finalClaim.timestamp}"
        jwt: "${finalClaim.jwt}"
      }
    })
    {
      document{
        id
        recipient
        latitude
        longitude
        timestamp
        jwt
      }
    }
  }
`)
        : null;
    console.log(data);
  };

  const createClaim = async () => {
    const finalClaim = await createBadge();
  };

  useEffect(() => {
    getUserLocation();
    if (address) {
      setLoggedIn(true);
    }
  }, [address]);

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="m-auto WhiteBox border-solid border-2 border-grey-800 text-center p-4 rounded">
        {address && (
          <div className="">
            <img alt="Network logo" className="logo" src={"/ethlogo.png"} />

            <p style={{ textAlign: "center" }}>
              {" "}
              Connected with: {address.slice(0, 6)}...{address.slice(-4)}{" "}
            </p>
            <br />
            <p style={{ textAlign: "center" }}>
              {" "}
              Current Location: Latitude: {
                userLocation?.latitude
              } Longitude: {userLocation?.longitude}
            </p>
          </div>
        )}

        <div className="GradientBar" />
        <div className="WhiteBox">
          <>
            {/* <div>Select Event</div>
            <form className="px-4 py-3 m-3">
              <select
                className="text-center"
                onChange={(values) =>
                  setEvent(values.target.value as unknown as "RepConnect" | "DePin")
                }
                value={event}
              >
                <option value="RepConnect">RepConnect</option>
                <option value="DePin">DePin</option>
              </select>
            </form> */}
            {/* @ts-ignore */}
          </>
          <button className="bg-gray-200 hover:bg-blue-700 text-black py-2 px-4 rounded" onClick={createClaim}>
            {attesting ? "Creating Claim..." : "Generate Badge"}
          </button>

          {address && (
            <>
              <div className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                {" "}
                <Link  href="/connections">Connections</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
