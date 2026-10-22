import styles from './LearningPage.module.css';
/** Decorative vectors already supplied with the platform design kit. */
export default function LearningBackdrop(){
  return <div data-learning-backdrop="true" className={styles.backdrop} aria-hidden="true"><span className={styles.topWave}/><span className={styles.bottomWave}/><span className={styles.rightNetwork}/><span className={styles.leftNetwork}/><span className={styles.orbOne}/><span className={styles.orbTwo}/><span className={styles.orbThree}/></div>;
}
