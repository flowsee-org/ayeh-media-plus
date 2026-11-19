import FloatingAssistantChat from '@/components/assistant/FloatingAssistantChat';

export const metadata = {
  title: 'دستیار هوش مصنوعی تدبر — آیه مدیا پلاس',
  description: 'راهنمای هوشمند تدبر در قرآن کریم و پاسخ به پرسش‌های دینی و معرفتی',
};

export default function AssistantRoute() {
  return <FloatingAssistantChat />;
}
