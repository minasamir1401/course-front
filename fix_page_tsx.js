const fs = require('fs');
let content = fs.readFileSync('src/app/exams/[id]/page.tsx', 'utf8');

const replacement = `  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPreviewAnswers, setShowPreviewAnswers] = useState(false);
  const hasAutoSubmitted = React.useRef(false);
  const [watermarkText, setWatermarkText] = useState("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("lms_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        let text = user.name || user.email || "Student";
        if (user.schoolName) text += " - " + user.schoolName;
        else if (user.schoolId) text += " - School: " + user.schoolId;
        text += " - klevro";
        setWatermarkText(text);
      } else {
        setWatermarkText("klevro");
      }
    } catch (e) {
      setWatermarkText("klevro");
    }
  }, []);

  useEffect(() => {
    fetchExam();
  }, [id]);`;

content = content.replace(/  const \[answers, setAnswers\] = useState\<any\[\]\>\(\[\]\);\s*const \[timeLeft, setTimeLeft\] = useState\(0\);\s*const \[submitting, setSubmitting\] = useState\(false\);\s*\}\, \[id\]\);/, replacement);

fs.writeFileSync('src/app/exams/[id]/page.tsx', content);
