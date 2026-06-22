import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileDown,
  Loader2,
  Search,
  SlidersHorizontal,
  User,
  X
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
// Import the necessary hooks from the payout API
import {
  useGetPayoutHistoryQuery,
  useGetPayoutByIdQuery,
  useCreatePayoutRequestMutation
} from "@/redux/features/payment/payoutApi";
import { toast } from "@/utils/toast";
import { Link } from "react-router-dom";

interface PayoutHistoryProps {
  teacherId: string;
}

const PayoutHistory = ({ teacherId }: PayoutHistoryProps) => {

  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: null as Date | null,
    endDate: null as Date | null,
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Create query params for API
  const queryParams = {
    page,
    limit: pageSize,
    status: filters.status === 'all' ? undefined : filters.status,
    startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
    endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
    search: filters.search || undefined,
  };

  const { data, isLoading, refetch } = useGetPayoutHistoryQuery({
    teacherId,
    ...queryParams
  });

  const { data: payoutDetails, isLoading: isLoadingDetails } = useGetPayoutByIdQuery(
    selectedPayoutId || "",
    { skip: !selectedPayoutId }
  );

  const [createPayout, { isLoading: isCreatingPayout }] = useCreatePayoutRequestMutation();

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      startDate: null,
      endDate: null,
      search: '',
    });
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (!data?.payouts?.length) {
      toast.error("No data to export", {
        description: "There are no payouts available to export.",
      });
      return;
    }

    // Create CSV content
    const headers = [
      "Date",
      "Amount",
      "Status",
      "Payout ID",
      "Processed Date",
      "Description",
    ];

    const csvRows = [
      headers.join(","),
      ...data.payouts.map((payout: any) => [
        format(new Date(payout.createdAt), "yyyy-MM-dd"),
        formatCurrency(payout.amount).replace("$", ""),
        payout.status,
        payout._id,
        payout.processedAt ? format(new Date(payout.processedAt), "yyyy-MM-dd") : "N/A",
        `"${payout.description?.replace(/"/g, '""') || "Payout"}"`,
      ].join(",")),
    ];

    const csvContent = csvRows.join("\n");

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payout-history-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Export successful", {
      description: "Your payout history has been exported to CSV.",
    });
  };

  const handleCreatePayout = async () => {
    try {
      await createPayout({ teacherId }).unwrap();
      toast.success("Payout requested", {
        description: "Your payout request has been submitted successfully.",
      });
      refetch();
    } catch (error: any) {
      toast.error("Error", {
        description: error.data?.message || "Failed to request payout. Please try again.",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>View your past and pending payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div>
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-3 w-16 mt-1" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  const payouts = data?.payouts || [];
  const availableBalance = data?.availableBalance || 0;

  return (
    <>
      <Card className="border border-muted/30 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>View your past and pending payouts</CardDescription>
            </div>
            <Link to="/teacher/earnings/report">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Detailed Report</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-muted/20 p-4 rounded-lg border border-muted/30">
            <div>
              <h3 className="text-base font-medium mb-1">Available for Payout</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(availableBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {availableBalance > 0
                  ? "You can request a payout for this amount"
                  : "Complete sales to receive payouts"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={handleCreatePayout}
                disabled={isCreatingPayout || availableBalance <= 0}
                className="w-full"
                size="lg"
              >
                {isCreatingPayout ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Request Payout"
                )}
              </Button>
              <Button
                onClick={handleExportCSV}
                disabled={!data?.payouts?.length}
                variant="outline"
                className="w-full sm:w-auto"
                size="lg"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filter UI */}
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search payouts..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-muted/20" : ""}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mb-4 p-4 border border-muted/30 rounded-lg bg-muted/5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.startDate || undefined}
                        onSelect={(date) => handleFilterChange('startDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="end-date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.endDate || undefined}
                        onSelect={(date) => handleFilterChange('endDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-muted/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 hover:bg-muted/10">
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center py-6">
                        <Clock className="h-10 w-10 text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground font-medium mb-1">No payout history found</p>
                        <p className="text-sm text-muted-foreground/70">
                          Your payout history will appear here once you request a payout
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout: any) => (
                    <TableRow key={payout._id} className="hover:bg-muted/5">
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(payout.createdAt), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(payout.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payout.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payout.status)}
                          {getStatusBadge(payout.status)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {payout.description || "Payout to connected account"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPayoutId(payout._id)}
                          className="hover:bg-muted/20"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {payouts.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-muted-foreground">
                Showing {payouts.length} of {data?.totalCount || 0} payout{(data?.totalCount || 0) !== 1 ? 's' : ''}
              </div>

              {/* Pagination */}
              {data?.totalCount && data.totalCount > pageSize && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Previous Page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, Math.ceil(data.totalCount / pageSize)) }, (_, i) => {
                      // Calculate page numbers to show (current page and surrounding pages)
                      const totalPages = Math.ceil(data.totalCount / pageSize);
                      let pageNumbers = [];

                      if (totalPages <= 5) {
                        // Show all pages if 5 or fewer
                        pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
                      } else {
                        // Show current page and surrounding pages
                        const startPage = Math.max(1, page - 2);
                        const endPage = Math.min(totalPages, page + 2);

                        pageNumbers = Array.from(
                          { length: endPage - startPage + 1 },
                          (_, i) => startPage + i
                        );

                        // Add ellipsis if needed
                        if (startPage > 1) {
                          pageNumbers = [1, '...', ...pageNumbers.slice(2)];
                        }

                        if (endPage < totalPages) {
                          pageNumbers = [...pageNumbers.slice(0, -2), '...', totalPages];
                        }
                      }

                      return pageNumbers.map((pageNum, idx) => {
                        if (pageNum === '...') {
                          return (
                            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                              ...
                            </span>
                          );
                        }

                        return (
                          <Button
                            key={`page-${pageNum}`}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(Number(pageNum))}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      });
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data?.totalCount || page >= Math.ceil(data.totalCount / pageSize)}
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Next Page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPayoutId} onOpenChange={(open) => !open && setSelectedPayoutId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>
              Details for payout #{selectedPayoutId?.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>

              <div>
                <Skeleton className="h-5 w-48 mb-3" />
                <div className="rounded-md border">
                  <div className="p-4">
                    <div className="flex justify-between mb-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between py-3 border-t">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : payoutDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="border border-muted/30 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-100 p-2 rounded-full">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                        <p className="text-xl font-semibold">{formatCurrency(payoutDetails.amount)}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground">Payout ID</h3>
                        <p className="text-sm font-mono">{payoutDetails._id}</p>
                      </div>

                      {payoutDetails.stripePayoutId && (
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground">Stripe Payout ID</h3>
                          <p className="text-sm font-mono">{payoutDetails.stripePayoutId}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-muted/30 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(payoutDetails.status)}
                          {getStatusBadge(payoutDetails.status)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground">Created</h3>
                        <p className="text-sm">{format(new Date(payoutDetails.createdAt), "PPP")}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(payoutDetails.createdAt), "p")}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground">Processed</h3>
                        {payoutDetails.processedAt ? (
                          <>
                            <p className="text-sm">{format(new Date(payoutDetails.processedAt), "PPP")}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(payoutDetails.processedAt), "p")}</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Pending</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {payoutDetails.description && (
                <div className="bg-muted/20 p-4 rounded-lg border border-muted/30">
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm">{payoutDetails.description}</p>
                </div>
              )}

              {payoutDetails.failureReason && (
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <h3 className="text-sm font-medium text-red-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Failure Reason
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{payoutDetails.failureReason}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-medium">Included Transactions</h3>
                  <div className="text-xs text-muted-foreground">
                    {payoutDetails.transactions?.length || 0} transaction{(payoutDetails.transactions?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="rounded-lg border border-muted/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/10 hover:bg-muted/10">
                        <TableHead>Course</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!payoutDetails.transactions || payoutDetails.transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            <div className="text-muted-foreground">No transactions found</div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        payoutDetails.transactions.map((transaction: any) => (
                          <TableRow key={transaction._id} className="hover:bg-muted/5">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {transaction.courseId?.courseThumbnail ? (
                                  <img
                                    src={transaction.courseId.courseThumbnail}
                                    alt={transaction.courseId.title || "Course"}
                                    className="h-8 w-8 rounded object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="font-medium truncate max-w-[150px]">
                                  {transaction.courseId?.title || "Unknown Course"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {transaction.studentId?.profileImg ? (
                                  <img
                                    src={transaction.studentId.profileImg}
                                    alt={transaction.studentId?.name?.firstName || "Student"}
                                    className="h-6 w-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                )}
                                <span>
                                  {transaction.studentId?.name?.firstName || "Unknown"}{" "}
                                  {transaction.studentId?.name?.lastName || "Student"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(transaction.teacherEarning)}
                            </TableCell>
                            <TableCell>
                              <div>
                                {format(new Date(transaction.createdAt), "MMM d, yyyy")}
                                <div className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No details available</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                The requested payout information could not be found
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PayoutHistory;
