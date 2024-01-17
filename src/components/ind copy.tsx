import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { GraphiQL } from "graphiql";
import Link from "next/link";
import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { definition } from "../__generated__/definition.js";
import { useComposeDB } from "../fragments";
import { ethers } from "ethers";

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

const SUBMIT_PASSPORT_URI = 'https://api.scorer.gitcoin.co/registry/submit-passport'
// endpoint for getting the signing message
const SIGNING_MESSAGE_URI = 'https://api.scorer.gitcoin.co/registry/signing-message'

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
        console.log(position.coords)
        setUserLocation({latitude, longitude});
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        console.log(typeof(latitude))
      }
      
      function error() {
        console.log("Unable to retrieve your location");
      }
    
    // if geolocation is not supported by the users browser
  
  };

  async function getSigningMessage() {
    try {
        // fetch the message to sign from the server
        const response = await fetch(SIGNING_MESSAGE_URI, {
          headers: {
            'Content-Type': 'application/json',
            "X-API-KEY": 'IPS3wFp8.bRjQEw3iZoFIqMhAUpz6V74AMOG9bkDc',
          },
        })
        // convert the response data to a json object
        const json = await response.json()
        return json
    } catch (err) {
        console.log('error: ', err)
    }
    }
     
    async function submitPassport() {
    try {
        // GET request to the Passport API to get the signing message and the nonce
        const { message, nonce } = await getSigningMessage()
        // instantiate a new provider instance
        const provider = new ethers.providers.Web3Provider(window.ethereum!)
        // call the provider's `getSigner` API method to start the signing process
        const signer = await provider.getSigner()
        // ask the user to sign the message
        const signature = await signer.signMessage(message)
        // POST request to the Passport API, sending the signing message, the signature, and the nonce
        const response = await fetch(SUBMIT_PASSPORT_URI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "X-API-KEY": 'IPS3wFp8.bRjQEw3iZoFIqMhAUpz6V74AMOG9bkDc',
        },
        body: JSON.stringify({
            address,
            scorer_id: '6356',
            signature,
            nonce
        })
        })
        // assign the response data to `data` as a json object
        const data = await response.json()
        console.log('data:', data)
    } catch (err) {
        console.log('error: ', err)
    }
    }

  async function getScore() {
    // setScore('')
    await submitPassport()
    const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/6356/${address}`
    try {
      const response = await fetch(GET_PASSPORT_SCORE_URI, {
        headers: ({
          'Content-Type': 'application/json',
          'X-API-Key': 'IPS3wFp8.bRjQEw3iZoFIqMhAUpz6V74AMOG9bkDc'
        })
      })
      const passportData = await response.json()
        if (passportData.score) {
        // if the user has a score, round it and set it in the local state
          const roundedScore = Math.round(passportData.score * 100) / 100
          const setScore = roundedScore.toString()
          console.log("PASSPORT SCORE = ", roundedScore)
        } else {
        // if the user has no score, display a message letting them know to submit thier passporta
         console.log('No score available, please add Stamps to your passport and then resubmit.')
        }
      } catch (err) {
        console.log('error: ', err)
      }
  }

  const createBadge = async () => {
   await getScore();
    const gitCoinResponse = await fetch(`https://api.scorer.gitcoin.co/registry/score/6356/${address?.toLowerCase()}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        "X-API-KEY": 'IPS3wFp8.bRjQEw3iZoFIqMhAUpz6V74AMOG9bkDc',
      },
    });
    const gitCoinData = await gitCoinResponse.json();
    const gitCoinScore = gitCoinData.score;
    console.log(gitCoinScore);
    const result = await fetch("/api/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: address,
        event,
        location: userLocation
      }),
    });
    const finalClaim = await result.json();
    console.log(finalClaim);
    const data = (event === "RepConnect") ? await compose.executeQuery(`
    mutation{
      createEthDen24RepCon(input: {
        content: {
          recipient: "${finalClaim.recipient}"
          latitude: ${finalClaim.latitude}
          longitude: ${finalClaim.longitude}
          timestamp: "${finalClaim.timestamp}"
          gitcoinScore: "${finalClaim.gitcoinScore}"
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
          gitcoinScore
          jwt
        }
      }
    }
  `) : await compose.executeQuery(`
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
`);
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
      <div className="m-auto w-1/2 h-1/2">
        {address && (
          <div className="right">
            <img alt="Network logo" className="logo" src={"/ethlogo.png"} />

            <p style={{ textAlign: "center" }}>
              {" "}
              Connected with: {address.slice(0, 6)}...{address.slice(-4)}{" "}
            </p>
            <br />
            <p style={{ textAlign: "center" }}>
              {" "}
              Current Location: Latitude: {userLocation?.latitude} Longitude: {userLocation?.longitude}
            </p>
          </div>
        )}

        <div className="GradientBar" />
        <div className="WhiteBox">
          <>
            <div>Select Event</div>
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
            </form>
            {/* @ts-ignore */}
   
          </>
          <button className="MetButton" onClick={createClaim}>
            {attesting ? "Creating Claim..." : "Generate Badge"}
          </button>

          {address && (
            <>
              <div className="SubText"> </div>
              <div className="SubText">
                {" "}
                <Link href="/connections">Connections</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
