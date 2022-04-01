import { Typography, Button, Drawer, Toolbar, List, Divider,
    ListItem, ListItemIcon, ListItemText, CssBaseline, IconButton, Switch } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import { styled, useTheme } from '@mui/material/styles';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import clsx from 'clsx';
import { useState, useEffect } from "react";
import { useEthers, useTokenBalance } from "@usedapp/core";
import { constants, ethers } from "ethers";
import { ImDroplet } from "react-icons/im";
import { AiFillShop } from "react-icons/ai";
import { BsFillHouseFill } from "react-icons/bs";

import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import Airdrops from "../components/Airdrops";
import ViewMarketplaceNFTs from "../components/ViewMarketplaceNFTs";
import ListNFTs from "../components/ListNFTs";
import styles from '../styles/marketplace.module.css';
import chainConfig from "../chain-config.json";

const drawerWidth = 240;

  const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
  })(({ theme, open }) => ({
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }));
  
  const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  }));

export default function DApp(props) {
    const theme = useTheme();

    const { account, activateBrowserWallet, deactivate, chainId } = useEthers();
    const networkName = "binance";
    const CHESAddress = chainId ? chainConfig["CHESTokenAddresses"][networkName] : constants.AddressZero
    const tokenBalance = useTokenBalance(CHESAddress, account);
    const isConnected = account !== undefined;

    const [currPage, setCurrPage] = useState("Airdrops");
    const [navDrawerOpen, setNavDrawerOpen] = useState(false);
    const [showWalletConnectionFailed, setShowWalletConnectionFailed] = useState(false);
    const [showWrongNetwork, setShowWrongNetwork] = useState(false);

    if (account && chainId != "56" && chainId != 56 && !showWrongNetwork) {
        setShowWrongNetwork(true);
    }

    const handleDrawerOpen = () => {
        setNavDrawerOpen(true);
    };
    
      const handleDrawerClose = () => {
        setNavDrawerOpen(false);
    };

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

    const updatePage = (pageName, hash) => {
        setCurrPage(pageName);
        window.location.hash = hash;
        window.scroll(0,0);
    }

    const updatePageWithHashChange = () => {
        const hash = window.location.hash;
        
        if (hash == "#airdrops") {
            setCurrPage("Airdrops");
        }
        else if (hash == "#marketplace") {
            setCurrPage("ViewMarketplaceNFTs");
        }
        else if (hash == "#mynfts") {
            setCurrPage("ListNFTs");
        }
    }

    useEffect(() => {
        updatePageWithHashChange();

        window.onhashchange = function() {
            updatePageWithHashChange();
        }
    }, [])

    return (
        <div className={styles.test}>
            <CssBaseline />

            <Snackbar open={showWalletConnectionFailed} autoHideDuration={6000} onClose={() => {setShowWalletConnectionFailed(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowWalletConnectionFailed(false)}} severity="error" sx={{ width: '100%' }} >
                    Failed to connect web3 wallet. Make sure you have a browser wallet like MetaMask installed.
                </MuiAlert>
            </Snackbar>
            <Snackbar open={showWrongNetwork} autoHideDuration={6000} onClose={() => {setShowWrongNetwork(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowWrongNetwork(false)}} severity="error" sx={{ width: '100%' }} >
                    Failed to connect web3 wallet - wrong network. Please connect to the Binance Smart Chain and refresh the page.
                </MuiAlert>
            </Snackbar>

            <AppBar position="fixed" open={navDrawerOpen}>
                <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={handleDrawerOpen}
                    edge="start"
                    sx={{ mr: 2, ...(navDrawerOpen && { display: 'none' }) }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    Chain Estate DAO DApp
                </Typography>

                {
                    isConnected && (
                        <Typography variant="h6" component="div" className={styles.CHESBalanceDiv}>
                            Balance: {tokenBalance ? Number((+ethers.utils.formatEther(BigInt(tokenBalance._hex).toString(10))).toFixed(2)).toLocaleString() : 0} CHES
                        </Typography>
                    )
                }

                <div className={styles.changeThemeDiv}>
                    {props.useDarkTheme ? <DarkModeIcon className={clsx(styles.darkModeIcon, styles.iconSizeTheme)} /> : <LightModeIcon className={styles.lightModeIcon} fontSize="large" />}
                    <Switch checked={props.useDarkTheme} color="primary" onChange={e => props.setUseDarkTheme(e.target.checked)} />
                </div>

                {isConnected ? (
                    <Button size="small" variant="contained" color="primary" onClick={deactivate}
                        className={clsx(styles.connectBtn, styles.largeScreenConnectBtn, props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight)}>
                        Disconnect
                    </Button>
                ) : (
                    <Button size="small" variant="contained" color="primary" onClick={() => connectBrowserWallet()}
                    className={clsx(styles.connectBtn, styles.largeScreenConnectBtn, props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight)}>
                        Connect
                    </Button>
                )
                }
                </Toolbar>
            </AppBar>
            <Drawer
                sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
                }}
                variant="persistent"
                anchor="left"
                open={navDrawerOpen}
            >
                <DrawerHeader>
                <IconButton onClick={handleDrawerClose}>
                    {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
                </DrawerHeader>
                <Divider />
                <List>

                <ListItem button onClick={() => updatePage("Airdrops", "airdrops")}>
                    <ListItemIcon>
                        <ImDroplet className={styles.navIcons} />
                    </ListItemIcon>
                    <ListItemText primary="Airdrop Rewards" />
                </ListItem>
                <ListItem button onClick={() => updatePage("ViewMarketplaceNFTs", "marketplace")}>
                    <ListItemIcon>
                        <AiFillShop className={styles.navIcons} />
                    </ListItemIcon>
                    <ListItemText primary="NFT Marketplace" />
                </ListItem>
                <ListItem button onClick={() => updatePage("ListNFTs", "mynfts")}>
                    <ListItemIcon>
                        <BsFillHouseFill className={styles.navIcons} />
                    </ListItemIcon>
                    <ListItemText primary="My NFTs" />
                </ListItem>

                <ListItem className={styles.navOptionsListItem}>
                    <div>
                        {props.useDarkTheme ? <DarkModeIcon className={clsx(styles.darkModeIcon, styles.iconSizeTheme)} /> : <LightModeIcon className={styles.lightModeIcon} fontSize="large" />}
                        <Switch checked={props.useDarkTheme} color="primary" onChange={e => props.setUseDarkTheme(e.target.checked)} />
                    </div>
                </ListItem>
                <ListItem className={styles.navOptionsListItem}>
                    {isConnected ? (
                            <Button size="small" variant="contained" color="primary" onClick={deactivate}
                                className={clsx(styles.connectBtn, props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight)}>
                                Disconnect
                            </Button>
                        ) : (
                            <Button size="small" variant="contained" color="primary" onClick={() => connectBrowserWallet()}
                            className={clsx(styles.connectBtn, props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight)}>
                                Connect
                            </Button>
                        )
                    }
                </ListItem>
                </List>
            </Drawer>

            {
                currPage == "Airdrops" && (
                    <Airdrops useDarkTheme={props.useDarkTheme} />
                )
            }
            {
                currPage == "ViewMarketplaceNFTs" && (
                    <ViewMarketplaceNFTs useDarkTheme={props.useDarkTheme} />
                )
            }
            {
                currPage == "ListNFTs" && (
                    <ListNFTs useDarkTheme={props.useDarkTheme} />
                )
            }
        </div>
    )
}