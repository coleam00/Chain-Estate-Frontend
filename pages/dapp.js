import Image from 'next/image';
import { Typography, Button, Drawer, Toolbar, List, Divider, Grid,
    ListItem, ListItemIcon, ListItemText, CssBaseline, IconButton, Switch, dividerClasses } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import { styled, useTheme } from '@mui/material/styles';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import clsx from 'clsx';
import { useState, useEffect } from "react";
import { useEthers, useTokenBalance } from "@usedapp/core";
import { useCoingeckoPrice } from '@usedapp/coingecko'
import { constants, ethers } from "ethers";
import WalletConnectProvider from '@walletconnect/web3-provider'
import { ImDroplet } from "react-icons/im";
import { AiFillShop } from "react-icons/ai";
import { BsFillHouseFill, BsCoin } from "react-icons/bs";
import { RiHandCoinFill } from "react-icons/ri";

import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import Airdrops from "../components/Airdrops";
import ViewMarketplaceNFTs from "../components/ViewMarketplaceNFTs";
import ListNFTs from "../components/ListNFTs";
import TokenMigration from "../components/TokenMigration";
import EmberCheckout from "../components/EmberCheckout";
import styles from '../styles/marketplace.module.css';
import CHESToken from "../contracts/ChainEstateToken.json";
import chainConfig from "../chain-config.json";
import metaMaskLogo from '../public/MetaMask.png';
import walletConnectLogo from '../public/WalletConnect.png';

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

const networkData = [
    {
      chainId: "0x38",
      chainName: "BSCMAINET",
      rpcUrls: ["https://bsc-dataseed1.binance.org"],
      nativeCurrency: {
        name: "BINANCE COIN",
        symbol: "BNB",
        decimals: 18,
      },
      blockExplorerUrls: ["https://bscscan.com/"],
    },
];

const rpcEndpoint = "https://bsc-dataseed.binance.org/";
const binanceChainId = 56;

export default function DApp(props) {
    const theme = useTheme();

    const { account, activateBrowserWallet, deactivate, chainId } = useEthers();
    const networkName = "binance";
    const CHESAddress = chainId ? chainConfig["CHESV2TokenAddresses"][networkName] : constants.AddressZero
    const tokenBalance = useTokenBalance(CHESAddress, account);
    const tokenPriceCG = useCoingeckoPrice('chain-estate-dao', 'usd');
    const isConnected = account !== undefined;

    const [currPage, setCurrPage] = useState("Airdrops");
    const [navDrawerOpen, setNavDrawerOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showWalletConnectionFailed, setShowWalletConnectionFailed] = useState(false);
    const [showWrongNetwork, setShowWrongNetwork] = useState(false);
    const [tempTokenBalance, setTempTokenBalance] = useState(0);
    const [tokenPricePercentChange, setTokenPricePercentChange] = useState(0.0);

    if (account && chainId != "56" && chainId != 56 && !showWrongNetwork) {
        setShowWrongNetwork(true);
        window.ethereum.request({

            method: "wallet_addEthereumChain",
        
            params: networkData,
        
          });
    }

    async function updateTempTokenBalance() {
        const chesABI = CHESToken.abi;
        const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint, { name: networkName, chainId: binanceChainId });
        const CHESContract = new ethers.Contract(CHESAddress, chesABI, provider);
        const userBalance = await CHESContract.balanceOf(account);
        setTempTokenBalance(userBalance);
    }
    
    useEffect(() => {
        if (account && (chainId == 56 || chainId == "56")) {
            updateTempTokenBalance();
        }
    }, [chainId])

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

    async function activateWalletConnect() {
        try {
          const provider = new WalletConnectProvider({
            infuraId: '7ef885ccab1e40919b0e4e5b37df9fb2',
          })
          await provider.enable()
          await activate(provider)
        } catch (error) {
          console.error(error)
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
        else if (hash == "#v2migration") {
            setCurrPage("V2Migration");
        }
        else if (hash == "#embercheckout") {
            setCurrPage("EmberCheckout");
        }
    }

    useEffect(() => {
        updatePageWithHashChange();

        window.onhashchange = function() {
            updatePageWithHashChange();
        }
    }, [])

    useEffect(() => {
        fetch('https://api.coingecko.com/api/v3/coins/chain-estate-dao')
        .then(response => response.json())
        .then(tokenInfo => setTokenPricePercentChange(parseFloat(tokenInfo.market_data.price_change_percentage_24h).toFixed(2)));
    }, [tokenPriceCG])

    return (
        <div>
            <CssBaseline />

            <Snackbar open={showWalletConnectionFailed} autoHideDuration={6000} onClose={() => {setShowWalletConnectionFailed(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowWalletConnectionFailed(false)}} severity="error" sx={{ width: '100%' }} >
                    Failed to connect web3 wallet. Make sure you have a browser wallet like MetaMask installed.
                </MuiAlert>
            </Snackbar>
            <Snackbar open={false && showWrongNetwork} autoHideDuration={6000} onClose={() => {setShowWrongNetwork(false)}}>
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
                    tokenPriceCG && (
                        <Typography variant="h6" component="div" className={styles.CHESPrice}>
                            CHES:&nbsp;
                        </Typography>
                    )
                }
                {
                    tokenPriceCG && (
                        <Typography variant="h6" component="div" className={clsx(styles.CHESPrice, styles.CHESPriceVal, tokenPricePercentChange > 0 ? props.useDarkTheme ? styles.greenPriceDark : styles.greenPriceLight : styles.redPrice)}>
                            ${tokenPriceCG} ({tokenPricePercentChange}%)
                        </Typography>
                    )
                }

                {
                    isConnected && (
                        <Typography variant="h6" component="div" className={styles.CHESBalance}>
                            Balance:&nbsp; 
                            {tokenBalance && Number((+ethers.utils.formatEther(BigInt(tokenBalance._hex).toString(10))).toFixed(2)).toLocaleString()}
                            {tempTokenBalance ? !tokenBalance ? Number((+ethers.utils.formatEther(BigInt(tempTokenBalance._hex).toString(10))).toFixed(2)).toLocaleString() : "" : 0}
                            &nbsp;CHES
                        </Typography>
                    )
                }

                <div className={styles.changeThemeDiv}>
                    {props.useDarkTheme ? <DarkModeIcon className={clsx(styles.darkModeIcon, styles.iconSizeTheme)} /> : <LightModeIcon className={styles.lightModeIcon} fontSize="large" />}
                    <Switch checked={props.useDarkTheme} color="primary" onChange={e => props.setUseDarkTheme(e.target.checked)} />
                </div>

                {isConnected && (
                    <Button size="small" variant="contained" color="primary" onClick={deactivate}
                        className={clsx(styles.connectBtn, styles.largeScreenConnectBtn, props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight)}>
                        Disconnect
                    </Button>
                )} 

                {!isConnected && !isConnecting && (
                    <Button size="small" variant="contained" color="primary" onClick={() => setIsConnecting(true)}
                        className={clsx(styles.connectBtn, styles.largeScreenConnectBtn, props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight)}>
                        Connect
                    </Button>
                )}

                {!isConnected && isConnecting && (
                    <>
                        <Button size="small" variant="contained" color="primary" onClick={() => connectBrowserWallet()}
                            className={clsx(styles.metaMaskBtn, styles.connectBtn, styles.largeScreenConnectBtn, props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight)}>
                            <Image src={metaMaskLogo} width={25} height={25} layout="fixed" /> &nbsp; MetaMask
                        </Button>
                        <Button size="small" variant="contained" color="primary" onClick={() => activateWalletConnect()}
                            className={clsx(styles.connectBtn, styles.largeScreenConnectBtn, props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight)}>
                            <Image src={walletConnectLogo} width={25} height={25} layout="fixed" /> &nbsp; WalletConnect
                        </Button>
                    </>
                )}  
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
                <ListItem button onClick={() => updatePage("V2Migration", "v2migration")}>
                    <ListItemIcon>
                        <RiHandCoinFill className={styles.navIcons} />
                    </ListItemIcon>
                    <ListItemText primary="V2 CHES Migration" />
                </ListItem>
                <ListItem button onClick={() => updatePage("EmberCheckout", "embercheckout")}>
                    <ListItemIcon>
                        <BsCoin className={styles.navIcons} />
                    </ListItemIcon>
                    <ListItemText primary="Ember Checkout" />
                </ListItem>

                <ListItem className={styles.navOptionsListItem}>
                    <div>
                        {props.useDarkTheme ? <DarkModeIcon className={clsx(styles.darkModeIcon, styles.iconSizeTheme)} /> : <LightModeIcon className={styles.lightModeIcon} fontSize="large" />}
                        <Switch checked={props.useDarkTheme} color="primary" onChange={e => props.setUseDarkTheme(e.target.checked)} />
                    </div>
                </ListItem>
                <ListItem className={styles.navOptionsListItem}>
                    {isConnected && (
                        <Button size="small" variant="contained" color="primary" onClick={deactivate}
                            className={props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight}>
                            Disconnect
                        </Button>
                    )} 

                    {!isConnected && !isConnecting && (
                        <Button size="small" variant="contained" color="primary" onClick={() => setIsConnecting(true)}
                            className={props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight}>
                            Connect
                        </Button>
                    )}

                    {!isConnected && isConnecting && (
                        <Button size="small" variant="contained" color="primary" onClick={() => connectBrowserWallet()}
                            className={props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight}>
                            <Image src={metaMaskLogo} width={25} height={25} layout="fixed" /> &nbsp; MetaMask
                        </Button>
                    )}  
                </ListItem>
                <ListItem className={styles.navOptionsListItem}>
                    {!isConnected && isConnecting && (
                        <Button size="small" variant="contained" color="primary" onClick={() => connectBrowserWallet()}
                            className={props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight}>
                            <Image src={walletConnectLogo} width={25} height={25} layout="fixed" /> &nbsp; WalletConnect
                        </Button>
                    )}  
                </ListItem>
                </List>

                <Divider className={styles.CHESPriceSmall} />

                <List>
                {
                    isConnected && (
                        <ListItem>
                            <Typography variant="p" component="div" className={clsx(styles.CHESBalanceSmall, "mb-2")}>
                                Balance:&nbsp; 
                                {tokenBalance && Number((+ethers.utils.formatEther(BigInt(tokenBalance._hex).toString(10))).toFixed(2)).toLocaleString()}
                                {tempTokenBalance ? !tokenBalance ? Number((+ethers.utils.formatEther(BigInt(tempTokenBalance._hex).toString(10))).toFixed(2)).toLocaleString() : "" : 0}
                                &nbsp;CHES
                            </Typography>
                        </ListItem>
                    )
                }

                {
                    tokenPriceCG && (
                        <ListItem>
                            <Typography variant="p" component="div" className={styles.CHESPriceSmall}>
                                CHES:&nbsp;
                            </Typography>
                        </ListItem>
                    )
                }
                {
                    tokenPriceCG && (
                        <ListItem>
                            <Typography variant="p" component="div" className={clsx(styles.CHESPriceSmall, tokenPricePercentChange > 0 ? props.useDarkTheme ? styles.greenPriceDark : styles.greenPriceLight : styles.redPrice)}>
                                ${tokenPriceCG} ({tokenPricePercentChange}%)
                            </Typography>
                        </ListItem>
                    )
                }
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
            {
                currPage == "V2Migration" && (
                    <TokenMigration useDarkTheme={props.useDarkTheme} />
                )
            }
            {
                currPage == "EmberCheckout" && (
                    <EmberCheckout useDarkTheme={props.useDarkTheme} />
                )
            }
        </div>
    )
}