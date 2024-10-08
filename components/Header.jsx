import React, { useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import Image from "next/image"
import images from "@/images/index"
import { Close, Menu } from "../components/index"

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const { isConnected, address } = useAccount()
    const account = useAccount()

    const isLocalhost = account?.chainId === 31337

    const navigation = [
        { title: "Home", path: "/" },
        { title: "Learn More", path: "/" },
        { title: "About Me", path: "/" },
        { title: "Contact", path: "/" },
        { title: "Feedback", path: "/" },
    ]

    const toggleMenu = (e) => {
        setIsMenuOpen((prev) => !prev)
    }

    return (
        <nav style={{ background: "#000014" }}>
            <div className={`p-5 flex mt-0 ${isMenuOpen ? "border-b-2" : ""}`}>
                <div className=" items-center gap-x-4 flex">
                    <Image className="w-12 " src={images.logo} alt="logo" />
                    <p className="name text-4xl text-yellow-200 ">C r y p t o W a g e r</p>
                </div>

                <div className={`flex-1 hidden lg:flex  justify-center items-center mx-4  `}>
                    <ul className=" flex  justify-between items-center gap-x-1 ">
                        {navigation.map((item, id) => (
                            <li
                                key={id}
                            >
                                <a href={item.path} className="block menu-btn">
                                    {item.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="ml-auto py-2 px-4">
                    {isConnected && isLocalhost ? (
                        <button className="p-2 bg-white rounded-lg text-black ">
                            {address.slice(0, 6)}......{address.slice(-4)}{" "}
                        </button>
                    ) : (
                        <ConnectButton label="Connect wallet" style={{}} />
                    )}{" "}
                </div>
            </div>
            {isMenuOpen ? (
                ""
            ) : (
                <div className=" lg:hidden grid grid-cols-2 border-y-2">
                    <div className=" p-2 ">
                        <button
                            onClick={() => toggleMenu()}
                            className=" text-xl text-yellow-200 flex items-center gap-x-1"
                        >
                            {" "}
                            <Menu />
                            Menu
                        </button>
                    </div>
                </div>
            )}
            {isMenuOpen && (
                <div className="overlay" onClick={toggleMenu}>
                    <div
                        className={`lg:hidden menu-slide w-64  p-4 rounded-md mt-28 ml-3 fixed top-0 left-0 h-full bg-gray-800 `}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-end mb-4">
                            <button onClick={toggleMenu} className="">
                                {" "}
                                <Close></Close>
                            </button>
                        </div>
                        <ul className="flex flex-col  gap-y-4">
                            {navigation.map((item, id) => (
                                <li
                                    key={id}
                                    className=" rounded-xl p-3 text-sm font-serif font-semibold text-white"
                                    style={{ background: "#000014" }}
                                >
                                    <a href={item.path} className="block">
                                        {item.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default Header
