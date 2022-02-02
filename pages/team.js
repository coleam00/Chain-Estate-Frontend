import Image from 'next/image';
import { Grid, Typography } from '@mui/material';
import clsx from 'clsx';

import colePic from '../public/Cole.png';
import sydneyPic from '../public/Sydney.png';
import zachPic from '../public/Zach.png';
import styles from '../styles/team.module.css';
import { FaLinkedin } from 'react-icons/fa';

export default function team(props) {
    return (
        <Grid container justifyContent="center" className={styles.mainGrid}>
            <Grid item xs={3} className={styles.spacingGrid}></Grid>
            <Grid item xs={4} className={styles.headerGrid}>
                <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                    Chain Estate DAO Core Team
                </Typography>
            </Grid>
            <Grid item xs={3} className={styles.spacingGrid}></Grid>
            <Grid item xs={10}>
                <Grid container justifyContent="center" alignItems="center" spacing={8}>
                    <Grid item xs={3} className={clsx(styles.teamGrid, styles.firstTeammate)}>
                        <Image src={zachPic} layout="responsive" />
                        <Typography variant="h5" className={styles.headerText}>
                            Zach Medin
                        </Typography>
                        <p className={styles.bioText}>
                            Real Estate Manager
                        </p>
                        <div className={styles.iconDiv}>
                            <a href="https://www.linkedin.com/in/zach-medin-183455230/" target="_blank" rel="noreferrer">
                                <FaLinkedin className={styles.linkedInIcon} />
                            </a>
                        </div>
                    </Grid>
                    <Grid item xs={3} className={styles.teamGrid}>
                        <Image src={colePic} layout="responsive" />
                        <Typography variant="h5" className={styles.headerText}>
                            Cole Medin
                        </Typography>
                        <p className={styles.bioText}>
                            Web3 Developer
                        </p>
                        <div className={styles.iconDiv}>
                            <a href="https://www.linkedin.com/in/cole-medin-727752184/" target="_blank" rel="noreferrer">
                                <FaLinkedin className={styles.linkedInIcon} />
                            </a>
                        </div>                        
                    </Grid>
                    <Grid item xs={3} className={clsx(styles.teamGrid, styles.lastTeammate)}>
                        <Image src={sydneyPic} layout="responsive" />
                        <Typography variant="h5" className={styles.headerText}>
                            Sydney Medin
                        </Typography>
                        <p className={styles.bioText}>
                            Graphic Designer
                        </p>
                        <div className={styles.iconDiv}>
                            <a href="https://www.linkedin.com/in/sydney-medin-ab607b203/" target="_blank" rel="noreferrer">
                                <FaLinkedin className={styles.linkedInIcon} />
                            </a>
                        </div>                        
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}