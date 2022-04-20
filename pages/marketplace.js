import { Grid, Typography } from '@mui/material';
import clsx from 'clsx';
import { useEthers, useTokenBalance } from "@usedapp/core";
import { constants } from "ethers";

import styles from '../styles/marketplace.module.css';
import chainConfig from "../chain-config.json";

import Navigation from '../components/Navigation';
import ViewMarketplaceNFTs from "../components/ViewMarketplaceNFTs";

export default function Marketplace(props) {
    const { account, chainId } = useEthers();
    const networkName = chainId ? chainConfig["chainIds"][chainId] : "Not Connected";
    const CHESAddress = chainId ? chainConfig["CHESV2TokenAddresses"][networkName] : constants.AddressZero;
    const tokenBalance = useTokenBalance(CHESAddress, account);
    const isConnected = account !== undefined;

    return (
        <>
        <Navigation useDarkTheme={props.useDarkTheme} setUseDarkTheme={props.setUseDarkTheme} />
        <Grid container justifyContent="center" className={styles.mainGrid}>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            <Grid item xs={4} className={styles.headerGrid}>
                <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                    Chain Estate DAO NFT Marketplace
                </Typography>
            </Grid>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            
            <ViewMarketplaceNFTs {...props} />
        </Grid>
        </>
    )
}