import Link from 'next/link';
import { ArrowUpRight, BookOpen, Check, CheckCheck, Compass, Layers3, Lightbulb, ListChecks, MessageCircle, ShieldCheck, Sparkles, Target } from 'lucide-react';
import styles from './LandingContent.module.css';

export default function LandingLearningSections({ ar }: { ar: boolean }) {
  const txt = (arabic: string, english: string) => ar ? arabic : english;
  const learning = [
    { icon: BookOpen, title: txt('افهم الفكرة', 'Understand the idea'), body: txt('شرح وأمثلة تساعدك تبني فهمك، خطوة بخطوة.', 'Build understanding through explanations and worked examples.') },
    { icon: Target, title: txt('حوّل الفهم إلى تطبيق', 'Put it into practice'), body: txt('تدريبات وواجبات واختبارات قصيرة، بحسب محتوى الدرس.', 'Practise with exercises, assignments and quizzes included in your lesson.') },
    { icon: ListChecks, title: txt('ارجع لما يحتاج مراجعة', 'Make room for review'), body: txt('استفد من النتائج والشروحات المتاحة لتراجع بثقة.', 'Use released results and explanations to guide your review.') },
  ];
  return <>
    <section id="learning-experience" className={`${styles.container} ${styles.learningSection}`} aria-labelledby="learning-title">
      <div className={styles.learningCopy}>
        <p className={styles.kicker}>{txt('داخل تجربة Klevro', 'THE LEARNING EXPERIENCE')}</p>
        <h2 id="learning-title">{txt('من «فهمت الفكرة»', 'From understanding')}<br/><span>{txt('إلى «أقدر أطبّقها».', 'to putting it into practice.')}</span></h2>
        <p className={styles.sectionIntro}>{txt('الدرس مش مجرد محتوى تشاهده. مساحة منظّمة تربط الشرح بالتدريب، وتساعدك ترجع للخطوة اللي تحتاجها.', 'A lesson is more than content to watch. It connects explanations and practice in one organised space, with room to revisit what you need.')}</p>
        <ul className={styles.learningPoints}>{learning.map(({ icon: Icon, title, body }) => <li key={title}><span><Icon size={20} aria-hidden="true"/></span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ul>
        <Link className={styles.editorialLink} href="/login">{txt('اكتشف دروسك المتاحة', 'Explore your available lessons')}<ArrowUpRight size={18} aria-hidden="true"/></Link>
      </div>
      <figure className={styles.lessonScene}>
        <div className={styles.sceneTop}><span className={styles.sceneLabel}><Layers3 size={16} aria-hidden="true"/>{txt('مساحة الدرس', 'Your lesson space')}</span><span>{txt('تعلّم · طبّق · راجع', 'LEARN · PRACTISE · REVIEW')}</span></div>
        <div className={styles.lessonSheet}>
          <div className={styles.lessonBreadcrumb}>{txt('الرياضيات / فهم الكسور', 'Mathematics / Understanding fractions')}</div>
          <h3>{txt('الفكرة أوضح لما تشوفها.', 'See the idea come together.')}</h3>
          <p>{txt('نمثل الكسر بأجزاء متساوية من الكل.', 'Represent fractions as equal parts of a whole.')}</p>
          <div className={styles.fractionExample} dir="ltr" role="img" aria-label={txt('نصف زائد ربع يساوي ثلاثة أرباع', 'One half plus one quarter equals three quarters')}>
            {[2, 1, 3].map((filled, index) => <div className={styles.fractionTerm} key={filled}>{index > 0 && <span className={styles.mathSign} aria-hidden="true">{index === 1 ? '+' : '='}</span>}<div><div className={styles.fractionBar} aria-hidden="true">{[0, 1, 2, 3].map(part => <span key={part} data-filled={part < filled}/>)}</div><span className={styles.fractionValue} aria-hidden="true">{index === 0 ? '½' : index === 1 ? '¼' : '¾'}</span></div></div>)}
          </div>
          <div className={styles.lessonInsight}><Lightbulb size={19} aria-hidden="true"/><span>{txt('نفس الفكرة، بأكثر من طريقة للفهم.', 'One idea. More than one way to understand it.')}</span></div>
          <div className={styles.lessonStages}>{[txt('شرح مبسّط', 'Explanation'), txt('مثال تطبيقي', 'Worked example'), txt('تدريب ومراجعة', 'Practice & review')].map((label, index) => <span key={label} data-current={index === 1}><Check size={13} aria-hidden="true"/>{label}</span>)}</div>
        </div>
        <figcaption>{txt('مثال توضيحي لتجربة الدرس · العناصر المتاحة تختلف حسب المحتوى المنشور.', 'An illustrative lesson preview · Available elements vary by published content.')}</figcaption>
      </figure>
    </section>

    <section id="learning-companion" className={`${styles.container} ${styles.companionSection}`} aria-labelledby="companion-title">
      <div className={styles.companionCopy}><p className={styles.companionKicker}><Sparkles size={16} aria-hidden="true"/>{txt('مساعد Klevro', 'KLEVRO ASSISTANT')}</p><h2 id="companion-title">{txt('سؤالك بداية.', 'Start with a question.')}<br/><span>{txt('وفهمك هو الهدف.', 'Keep understanding in focus.')}</span></h2><p>{txt('مساعدة مرتبطة برحلتك التعليمية: افهم درسًا، راجع نتائجك المتاحة، ورتّب أولويات مذاكرتك بدل ما تبدأ من الصفر كل مرة.', 'Help connected to your learning journey. Explore a lesson, reflect on released results and choose what to practise next.')}</p>
        <div className={styles.companionBenefits}>{[
          { icon: MessageCircle, title: txt('اسأل بطريقتك', 'Ask your way'), text: txt('اكتب سؤالك بالعربي أو بالإنجليزي، وناقش الخطوة الصعبة.', 'Use Arabic or English to talk through a difficult step.') },
          { icon: Compass, title: txt('اعرف خطوتك التالية', 'Find your next step'), text: txt('اقتراحات للمراجعة مبنية على نتائجك ودروسك المتاحة.', 'Review suggestions based on your released results and accessible lessons.') },
          { icon: ShieldCheck, title: txt('مساحة تحترم خصوصيتك', 'Your own learning context'), text: txt('بيانات حسابك متاحة لك بعد الدخول؛ المساعد مخفي أثناء التقييمات.', 'Personal context requires sign-in. The assistant is hidden during assessments.') },
        ].map(({ icon: Icon, title, text }) => <div key={title}><Icon size={19} aria-hidden="true"/><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
      </div>
      <figure className={styles.companionPreview}>
        <div className={styles.previewHeader}><span className={styles.previewMark}><Sparkles size={23} aria-hidden="true"/></span><div><strong>{txt('معك خطوة بخطوة', 'One step at a time')}</strong><span>{txt('توضيح للفكرة، ومساحة للنقاش', 'A little clarity. A place to talk it through.')}</span></div><span className={styles.previewBadge}>AI</span></div>
        <div className={styles.previewQuestion}>{txt('فهمت الشرح، أبدأ المراجعة منين؟', 'I understand the explanation. What should I review next?')}</div>
        <div className={styles.previewAnswer}><span><Sparkles size={14} aria-hidden="true"/>Klevro</span><p>{txt('ابدأ بفكرة واحدة. جرّب مثالًا بنفسك، وحدّد الخطوة اللي احتجت فيها مساعدة. نقدر نراجعها معًا، ثم ترجع لتقريرك وتشوف نتائجك المتاحة.', 'Start with one idea. Try an example yourself and identify the step where you needed help. We can discuss it together, then you can revisit your report and released results.')}</p></div>
        <div className={styles.reviewPath}><CheckCheck size={19} aria-hidden="true"/><div><strong>{txt('افهم. جرّب. راجع.', 'Understand. Practise. Reflect.')}</strong><span>{txt('خطوات بسيطة لمراجعة لها هدف.', 'Small steps for purposeful review.')}</span></div></div>
        <figcaption>{txt('محادثة توضيحية · التحليل الفعلي يعتمد على بياناتك المتاحة وتفعيل المساعد.', 'Illustrative conversation · Personal insights depend on your available records and assistant activation.')}</figcaption>
      </figure>
    </section>
  </>;
}
