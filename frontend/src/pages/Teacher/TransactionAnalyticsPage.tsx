import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import TransactionAnalytics from "@/components/Teacher/TransactionAnalytics";
import { useEffect } from "react";

const TransactionAnalyticsPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Set the document title
    document.title = "Transaction Analytics | Teacher Dashboard";
  }, []);

  return (
    <div className="container mx-auto py-6">
      <TransactionAnalytics />
    </div>
  );
};

export default TransactionAnalyticsPage;
