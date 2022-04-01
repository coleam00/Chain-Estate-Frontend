import { Grid, Typography } from '@mui/material';
import clsx from 'clsx';

import Navigation from '../components/Navigation';
import styles from '../styles/presale.module.css';

export default function preSale(props) {
    return (
        <>
        <Navigation useDarkTheme={props.useDarkTheme} setUseDarkTheme={props.setUseDarkTheme} />
        <Grid container justifyContent="center" className={styles.mainGrid}>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            <Grid item xs={4} className={styles.headerGrid}>
                <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                    Real Estate Investment Voting
                </Typography>
            </Grid>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            <Grid item xs={8} className={styles.comingSoonText}>
                <Typography variant="h5">
                    Coming soon...
                </Typography>
            </Grid>
            <Grid item xs={8} className={styles.launchText}>
                <Typography variant="h6">
                    Here is where Chain Estate DAO investors will be able to vote on real estate investments for the project.
                    The more CHES tokens an investor has, the more their vote will impact which real estate investments are pursued.
                    This voting page will be released along with the voting smart contract after the initial dex offering.
                </Typography>
            </Grid>
        </Grid>
        </>
    )
}