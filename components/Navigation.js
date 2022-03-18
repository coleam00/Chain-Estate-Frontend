import { Grid, Typography, Switch, Button } from '@mui/material';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { gsap } from "gsap";
import { IconContext } from "react-icons";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { FaDiscord, FaTwitter, FaTelegram } from 'react-icons/fa';
import { useEthers } from "@usedapp/core";

import styles from '../styles/Navigation.module.css';

export default function Navigation({useDarkTheme, setUseDarkTheme}) {
    gsap.registerPlugin(ScrollToPlugin);

    const { account, activateBrowserWallet, deactivate, chainId } = useEthers();
    const sections = ["about", "tokenomics", "roadmap"];
    const walletSections = ["marketplace", "mynfts", "createnfts"];

    const [isWalletPage, setIsWalletPage] = useState(false);
    const [showWalletConnectionFailed, setShowWalletConnectionFailed] = useState(false);
    const [showWrongNetwork, setShowWrongNetwork] = useState(false);

    if (account && chainId != "97" && chainId != 97 && !showWrongNetwork) {
        setShowWrongNetwork(true);
    }

    const moveToSection = (section) => {
        if (window.location.pathname == "/") {
            gsap.to(window, {duration: 0.1, scrollTo:`#${section}`});
        }
        else {
            window.location.href = `${window.location.origin}/?section=${section}`;
        }
    }

    useEffect(() => {
        const currUrl = window.location.href;
        const currUrlSplit = currUrl.split("?section=");
        if (currUrlSplit.length > 1) {
            const urlSection = currUrlSplit[1];
            if (sections.includes(urlSection)) {
                gsap.to(window, {duration: 0.1, scrollTo:`#${urlSection}`});
            }
        }

        for (let i = 0; i < walletSections.length; i++) {
            if (currUrl.includes(walletSections[i])) {
                setIsWalletPage(true);
            }
        }
    }, []);

    const connectBrowserWallet = () => {
        try {
            activateBrowserWallet();
        }
        catch {
            setShowWalletConnectionFailed(true);
        }
        if (!window.ethereum) {
            setShowWalletConnectionFailed(true);
        }
    }

    const isConnected = account !== undefined;

    return (
        <Grid container justifyContent="center" className={useDarkTheme ? styles.navGridDark : styles.navGridLight}>
            <Snackbar open={showWalletConnectionFailed} autoHideDuration={6000} onClose={() => {setShowWalletConnectionFailed(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowWalletConnectionFailed(false)}} severity="error" sx={{ width: '100%' }} >
                    Failed to connect web3 wallet. Make sure you have a browser wallet like MetaMask installed.
                </MuiAlert>
            </Snackbar>
            <Snackbar open={showWrongNetwork} autoHideDuration={6000} onClose={() => {setShowWrongNetwork(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowWrongNetwork(false)}} severity="error" sx={{ width: '100%' }} >
                    Failed to connect web3 wallet - wrong network. Please connect to the Binance Testnet and refresh the page.
                </MuiAlert>
            </Snackbar>
            <Navbar expand="lg" bg={useDarkTheme ? "custom-dark" : "custom-light"} variant={useDarkTheme ? "dark" : "light"} className={clsx("m-auto", styles.navBar)}>
                <Navbar.Text className={styles.navBarBrand}>
                    <Container>
                        <Navbar.Brand href="/">
                            <img alt="" src={useDarkTheme ? "/houseIconDarkTheme.png" : "/houseIconLightTheme.png"} width="35" height="35" className={clsx(styles.logoImage, "align-top")} />
                            <Typography variant="p" className={styles.navBrandText}>
                                Chain Estate DAO
                            </Typography>
                        </Navbar.Brand>
                    </Container>
                </Navbar.Text>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className={styles.navBarItems}>
                    <Nav>
                        <Nav.Link href="/" className={styles.navPadding}>
                            <Typography variant="h6" className={clsx(useDarkTheme ? styles.navbarDarkCustom : styles.navbarLightCustom, styles.navText)}>
                                Home
                            </Typography>
                        </Nav.Link>
                        <Nav.Link href="/marketplace" className={styles.navPadding} >
                            <Typography variant="h6" className={clsx(useDarkTheme ? styles.navbarDarkCustom : styles.navbarLightCustom, styles.navText)}>
                                NFT Marketplace
                            </Typography>
                        </Nav.Link>
                        <Nav.Link href="/mynfts" className={styles.navPadding} >
                            <Typography variant="h6" className={clsx(useDarkTheme ? styles.navbarDarkCustom : styles.navbarLightCustom, styles.navText)}>
                                My NFTs
                            </Typography>
                        </Nav.Link>
                        <Nav.Link className={styles.navPadding} onClick={() => moveToSection("roadmap")}>
                            <Typography variant="h6" className={clsx(useDarkTheme ? styles.navbarDarkCustom : styles.navbarLightCustom, styles.navText)}>
                                Roadmap
                            </Typography>
                        </Nav.Link>
                        <Nav.Link href="https://chain-estate.gitbook.io/chain-estate-whitepaper/" target="_blank" className={styles.navPadding}>
                            <Typography variant="h6" className={clsx(useDarkTheme ? styles.navbarDarkCustom : styles.navbarLightCustom, styles.navText)}>
                                White Paper
                            </Typography>
                        </Nav.Link>
                        <Nav.Link href="/ido" className={styles.navPadding}>
                            <Typography variant="h6" className={clsx(useDarkTheme ? styles.navbarDarkCustom : styles.navbarLightCustom, styles.navText)}>
                                IDO
                            </Typography>
                        </Nav.Link>
                        <Nav.Link href="/vote" className={styles.navPadding}>
                            <Typography variant="h6" className={clsx(useDarkTheme ? styles.navbarDarkCustom : styles.navbarLightCustom, styles.navText)}>
                                Voting
                            </Typography>
                        </Nav.Link>
                        <div className={styles.changeThemeDiv}>
                            {useDarkTheme ? <DarkModeIcon className={clsx(styles.darkModeIcon, styles.iconSizeTheme)} /> : <LightModeIcon className={styles.lightModeIcon} fontSize="large" />}
                            <Switch checked={useDarkTheme} color="primary" onChange={e => setUseDarkTheme(e.target.checked)} />
                        </div>
                        {
                            !isWalletPage && (
                                <IconContext.Provider value={{ color: useDarkTheme ? "#1649ff" : "#70c1ff" }} className={styles.socialIcons}>
                                    <div className={styles.socialIcons}>
                                        <div className={styles.socialIcon}>
                                            <a href="https://discord.gg/ahHu45hEvv" target="_blank" rel="noreferrer">
                                                <FaDiscord className={styles.iconSize} />
                                            </a>
                                        </div>
                                        <div className={clsx(styles.socialIcon, styles.socialIconSpacing)}>
                                            <a href="https://twitter.com/chainestatedao" target="_blank" rel="noreferrer">
                                                <FaTwitter className={styles.iconSize} />
                                            </a>
                                        </div>
                                        <div className={clsx(styles.socialIcon, styles.socialIconSpacing)}>
                                            <a href="https://t.me/chainestatedao" target="_blank" rel="noreferrer">
                                                <FaTelegram className={styles.iconSize} />
                                            </a>
                                        </div>
                                    </div>
                                </IconContext.Provider>
                            )
                        }

                        {
                            isWalletPage && (
                                <div className={styles.connectBtnDiv}>
                                    {isConnected ? (
                                        <Button size="small" variant="contained" color="primary" onClick={deactivate}
                                            className={useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight}>
                                            Disconnect
                                        </Button>
                                    ) : (
                                        <Button size="small" variant="contained" color="primary" onClick={() => connectBrowserWallet()}
                                            className={useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight}>
                                            Connect
                                        </Button>
                                    )
                                    }
                                </div>
                            )
                        }
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        </Grid>
    )
}