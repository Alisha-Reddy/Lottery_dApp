import React from "react"
import { abi, contractAddresses } from "../constants"
import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { ethers } from "ethers"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const Main = () => {
    const [contractAddress, setContractAddress] = useState(null)
    const [contract, setContract] = useState(null)
    const [enteranceFee, setEnteranceFee] = useState(null)
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")
    const [lotteryStatus, setLotteryStatus] = useState("0")
    const [players, setPlayers] = useState([])
    const [isFetching, setIsFetching] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showStatus, setShowStatus] = useState(false)

    const { isConnected, address } = useAccount()
    const account = useAccount()
    const chainId = account.chainId

    // Set contract address based on chainId
    useEffect(() => {
        if (chainId) {
            console.log("chainId:", chainId)
            const lotAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
            if (lotAddress) {
                setContractAddress(lotAddress)
                console.log("contract Address:", lotAddress)
            } else {
                console.error("Invalid chain ID or contact address not found for this chain")
            }
        }
    }, [chainId])

    // Initialize contract instance
    useEffect(() => {
        if (typeof window !== "undefined" && window.ethereum && contractAddress) {
            console.log("Using contractAddress:", contractAddress)
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const lotteryContract = new ethers.Contract(contractAddress, abi, signer)

            setContract(lotteryContract)
            // console.log(contract)
        }
    }, [contractAddress])

    // Call function to Fetch entrance fee from contract
    const getEntranceFee = async () => {
        if (contract) {
            try {
                // console.log("1")
                setIsFetching(true)
                const fee = await contract.getEnteranceFee()
                setIsLoading(true)
                // console.log("fee:", fee)
                const feeInEther = ethers.utils.formatEther(fee)
                console.log("Enterance fee:", feeInEther)
                return feeInEther
            } catch (error) {
                console.error(error)
            } finally {
                setIsFetching(false) // Stop fetching
                setIsLoading(false) // Stop processing
            }
        }
    }

    // Call function to Get number of players
    const getNumberOfPlayers = async () => {
        if (contract) {
            try {
                const numOfPlayers = await contract.getNumberOfPlayers()
                return numOfPlayers.toString()
            } catch (error) {
                console.error(error)
            }
        }
    }

    // Read Recent Winner
    const getRecentWinner = async () => {
        if (contract) {
            try {
                const recentWinner = await contract.getRecentWinner()
                return recentWinner.toString()
            } catch (error) {
                console.error(error)
            }
        }
    }

    // Read Lottery State
    const getLotteryState = async () => {
        if (contract) {
            try {
                const lotteryState = await contract.getLotteryState()
                console.log(lotteryState)
                return lotteryState.toString()
            } catch (error) {
                console.error(error)
            }
        }
    }

    // Read players
    const getPlayers = async () => {
        if (contract) {
            try {
                const numOfPlayers = await getNumberOfPlayers()
                const playersArray = []
                for (let i = 0; i < numOfPlayers; i++) {
                    const player = await contract.getPalyers(i)
                    playersArray.push(player)
                }
                setPlayers(playersArray)
                setNumPlayers(playersArray.length.toString())
            } catch (error) {
                console.error(error)
            }
        }
    }

    // Call function to get entrance fee when connected
    useEffect(() => {
        async function fetchFee() {
            if (isConnected) {
                const entranceFeeFromCall = await getEntranceFee()
                console.log("fetched fee:", entranceFeeFromCall)

                setEnteranceFee(entranceFeeFromCall)
            }
        }
        fetchFee()
    }, [isConnected])

    // Updating UI
    async function updateUI() {
        console.log("Updating UI...")
        try {
            if (isConnected) {
                // const entranceFeeFromCall = await getEntranceFee()
                // const numPlayersFromCall = await getNumberOfPlayers()
                // console.log("num players:", numPlayersFromCall)
                const recentWinnerFromCall = await getRecentWinner()
                const lotteryState = await getLotteryState()

                // setEnteranceFee(entranceFeeFromCall)
                // setNumPlayers(numPlayersFromCall)
                setRecentWinner(recentWinnerFromCall)
                setLotteryStatus(lotteryState)

                await getPlayers()
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Enter lottery function with notifications
    const enterLottery = async () => {
        if (contract) {
            try {
                const feeInWei = ethers.utils.parseEther(enteranceFee)
                console.log("Fee:", feeInWei.toString())

                toast.info(
                    <div>
                        <strong>Transaction Submitted</strong>
                        <br />
                        Waiting for confirmation...
                    </div>,
                )
                console.log("2")
                const tx = await contract.enterLottery({
                    value: feeInWei,
                    gasLimit: ethers.utils.hexlify(300000),
                })
                console.log("tx:", tx)
                const receipt = await tx.wait()
                console.log("Transaction confirmed:", receipt)
                updateUI()

                toast.success(
                    <div>
                        <strong>Success!</strong>
                        <br />
                        You have entered the lottery.
                    </div>,
                )
            } catch (error) {
                console.error("Error entering the lottery:", error)
                toast.error(
                    <div>
                        <strong>Error!</strong>
                        <br />
                        Transaction failed. Please try again.
                    </div>,
                )
            }
        }
    }

    // Winner picked update
    useEffect(() => {
        if (contract) {
            const handleWinnerPicked = async (winner) => {
                console.log("WinnerPicked event detected:", winner)
                setRecentWinner(winner) // Automatically updates the recent winner in the UI
                toast.success(`New Winner: ${winner}`)
                updateUI()
            }

            // Listen for the WinnerPicked event
            contract.on("WinnerPicked", handleWinnerPicked)

            // Clean up the event listener when the component unmounts or contract changes
            return () => {
                contract.off("WinnerPicked", handleWinnerPicked)
            }
        }
    }, [contract])

    // Player update
    useEffect(() => {
        getPlayers()
    }, [contract])

    return (
        <main className="md:m-10">
            <div className="flex flex-col items-center mb-20">
                <div>
                    <h1
                        className=" text-5xl  text-center"
                        style={{
                            textShadow: "2px 2px 3px #fde047",
                            color: "#020253",
                            fontFamily: "'Gorditas', serif",
                        }}
                    >
                        WELCOME TO CRYPTOWAGER
                    </h1>
                </div>
                <div
                    className="text-center text-md p-3 "
                    style={{ fontWeight: "bolder", color: "#000014" }}
                >
                    CryptoWager makes it easy to dive into a decentralized lottery. Just enter, and
                    who knows? You might be the next lucky winner. <br /> No fuss, just simple and
                    fair play. Jump in and take your shot!
                </div>
            </div>

            <div>
                {/* ENTER LOTTERY FEE */}
                <div className=" flex justify-start p-0">
                    <div className="cards w-full lg:w-3/4 p-5 lg:p-10 my-5 ">
                        <div className="flex flex-row flex-1  gap-1">
                            <div className="flex-1 ">
                                <h1 className="md:text-4xl text-yellow-200 text-xl">
                                    Lottery Value
                                </h1>
                                {!isConnected ? (
                                    <h3
                                        className="my-5 text-2xl"
                                        style={{ fontFamily: "'Gorditas', serif" }}
                                    >
                                        Connect to See the Jackpot
                                    </h3>
                                ) : (
                                    <>
                                        <h3 className="my-4 text-lg font-extrabold text-shadow ">
                                            {" "}
                                            <i>What’s Up for Grabs?</i>
                                        </h3>
                                        <h4 className="text-lg pb-3">
                                            Lottery Value:{" "}
                                            <b>{enteranceFee ? `${enteranceFee} ETH` : "N/A"}</b>
                                        </h4>
                                    </>
                                )}
                            </div>
                            <div className="flex-1 flex items-start justify-center ">
                                {isConnected ? (
                                    <button
                                        className="btn text-xl lg:text-4xl"
                                        onClick={async function () {
                                            await enterLottery()
                                        }}
                                    >
                                        Buy Lottery
                                    </button>
                                ) : (
                                    ""
                                )}
                            </div>
                        </div>
                        {!isConnected ? (
                            <p>
                                To check out the current jackpot value, please connect your wallet
                                first. <br />
                                Once connected, you'll see the prize and can enter for a chance to
                                win!
                            </p>
                        ) : (
                            <p>
                                The jackpot is sitting at{" "}
                                <b>
                                    <i> {enteranceFee ? `${enteranceFee} ETH` : "N/A"} </i>
                                </b>
                                ! Ready to take your shot?
                                <br /> Click <b>"Buy Lottery"</b> to enter and seize your chance to
                                win this prize.
                            </p>
                        )}
                    </div>
                </div>

                {/* CHECK LOTTERY STATUS */}
                <div className=" flex justify-end p-0">
                    <div className="cards w-full lg:w-3/4 lg:p-10 my-5 p-5 ">
                        <div className="flex flex-row flex-1  gap-1">
                            <div className="flex-1 ">
                                <h1 className="md:text-4xl text-yellow-200 text-xl">
                                    Lottery Status
                                </h1>
                                {!isConnected ? (
                                    <h3
                                        className="my-5 text-2xl"
                                        style={{ fontFamily: "'Gorditas', serif" }}
                                    >
                                        Connect to Check the Status
                                    </h3>
                                ) : (
                                    <h3 className="my-4 text-lg font-extrabold text-shadow ">
                                        <i>Curious About the Current Status?</i>
                                    </h3>
                                )}
                            </div>
                            <div className="flex-1 flex items-start justify-center ">
                                {isConnected ? (
                                    showStatus ? (
                                        <div className="showCase">
                                            {lotteryStatus === "0" ? `OPEN ` : "CLOSE"}
                                        </div>
                                    ) : (
                                        <button
                                            className="btn text-xl lg:text-4xl"
                                            onClick={() => setShowStatus(true)}
                                        >
                                            Check Status
                                        </button>
                                    )
                                ) : (
                                    ""
                                )}
                            </div>
                        </div>
                        {!isConnected ? (
                            <p>
                                To check the current lottery status, please connect your wallet
                                first. <br /> Once connected, you'll see if we're open for entries,
                                drawing, or waiting for the next round!
                            </p>
                        ) : !showStatus ? (
                            <p>
                                Click the{" "}
                                <b>
                                    <i>Lottery Status</i>
                                </b>{" "}
                                button to check if... <br /> we’re open for entries, drawing, or
                                waiting for the next round. Stay updated!
                            </p>
                        ) : (
                            <h4 className="text-lg pb-3">
                                Lottery Status: <b>{lotteryStatus === "0" ? `OPEN ` : "CLOSE"}</b>
                            </h4>
                        )}
                    </div>
                </div>

                {/* CHECK RECENT WINNER */}
                <div className=" flex justify-start p-0">
                    <div className="cards w-full lg:w-3/4 lg:p-10 my-5 p-5 ">
                        <div className="flex flex-row flex-1  gap-1">
                            <div className="flex-1 ">
                                <h1 className="md:text-4xl text-yellow-200 text-xl">
                                    Recent Champion
                                </h1>
                                {!isConnected ? (
                                    <h3
                                        className="my-5 text-2xl"
                                        style={{ fontFamily: "'Gorditas', serif" }}
                                    >
                                        Connect to See the Latest Winner
                                    </h3>
                                ) : (
                                    <>
                                        <h3 className="my-4 text-lg font-extrabold text-shadow ">
                                            <i>Who’s the Latest Lucky Winner?</i>
                                        </h3>

                                        {recentWinner !== "0" ? (
                                            <h4 className="text-lg pb-3">
                                                The Lucky Champ: <b>{recentWinner}</b>
                                            </h4>
                                        ) : (
                                            ""
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        {!isConnected ? (
                            <p>
                                To find out who’s recently taken home the prize, connect your wallet
                                first. <br /> Once you’re in, you’ll see who’s claimed the jackpot
                                and maybe it’ll be your turn next!
                            </p>
                        ) : recentWinner === "0" ? (
                            <p>
                                No one has claimed the prize just yet.
                                <br /> Maybe you’ll be the first to make it happen!
                            </p>
                        ) : (
                            ""
                        )}
                    </div>
                </div>

                {/* CHECK LOTTERY STATUS */}
                <div className=" flex justify-end p-0">
                    <div className="cards w-full lg:w-3/4 lg:p-10 my-5 p-5 ">
                        <div className="flex flex-row flex-1  gap-1">
                            <div className="flex-1 ">
                                <h1 className="md:text-4xl text-yellow-200 text-xl">
                                    Participants
                                </h1>
                                {!isConnected ? (
                                    <h3
                                        className="my-5 text-2xl"
                                        style={{ fontFamily: "'Gorditas', serif" }}
                                    >
                                        Connect to See Who’s Playing
                                    </h3>
                                ) : (
                                    <>
                                        <h3 className="my-2 text-lg font-extrabold text-shadow ">
                                            <i>Connect to See Who’s Playing</i>
                                        </h3>
                                        {isConnected ? (
                                            <div>
                                                {players.length > 0 ? (
                                                    <ul>
                                                        {players.map((playerAddress, index) => (
                                                            <li key={index}>
                                                                {index + 1}. {playerAddress}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>No players have joined yet.</p>
                                                )}
                                            </div>
                                        ) : (
                                            ""
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="flex-1 flex items-start justify-center ">
                                {isConnected && players.length ? (
                                    <div className="showCase">{players.length} Player(s)</div>
                                ) : (
                                    ""
                                )}
                            </div>
                        </div>
                        {!isConnected ? (
                            <p>
                                Check out the list of participants in this lottery round by
                                connecting. It’s always exciting to see who’s in the game with you!
                            </p>
                        ) : (
                            ""
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}

export default Main
