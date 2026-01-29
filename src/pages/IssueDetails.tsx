import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { useIssues } from "@/context/IssuesContext";
import { useAuth } from "@/context/AuthContext";
import { ISSUE_STATUSES, IssueStatus } from "@/types/issue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

const categoryIcons: Record<string, string> = {
  "Roads & Infrastructure": "🛣️",
  "Water & Sewage": "💧",
  Electricity: "⚡",
  "Waste Management": "🗑️",
  "Public Safety": "🚨",
  "Parks & Recreation": "🌳",
  Pothole: "🕳️",
  Garbage: "🗑️",
  "Water Leak": "💧",
  Lighting: "💡",
  Traffic: "🚦",
  Other: "📋",
};

const IssueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { issues, loading, refetchIssues } = useIssues();
  const { profile } = useAuth();
  const { toast } = useToast();
  const isEmployee = profile?.role === "employee";

  const issue = issues.find((i) => i.id === Number(id));

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'under_review':
        return t('status.underReview');
      case 'under_maintenance':
        return t('status.underMaintenance');
      case 'resolved':
        return t('status.resolved');
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!issue) return;
    try {
      const { data, error } = await supabase.functions.invoke("classify-report", {
        body: { type: "issue", id: issue.id, status: newStatus },
      });

      if (error || !data?.success) throw error || new Error(data?.error || "Update failed");
      
      await refetchIssues();
      toast({ 
        title: t('issueDetails.statusUpdated'), 
        description: `${t('issueDetails.issueMarkedAs')} ${getStatusLabel(newStatus)}` 
      });
    } catch (error) {
      toast({ title: t('common.error'), description: t('issueDetails.failedToUpdateStatus'), variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.issueNotFound')}</p>
      </div>
    );
  }

  const currentStatus = ISSUE_STATUSES[issue.status as IssueStatus] || ISSUE_STATUSES.under_review;
  
  // Validate coordinates are safe numbers before using in URLs
  const safeLatitude = typeof issue.latitude === 'number' && isFinite(issue.latitude) ? issue.latitude : 0;
  const safeLongitude = typeof issue.longitude === 'number' && isFinite(issue.longitude) ? issue.longitude : 0;
  const hasValidCoordinates = safeLatitude !== 0 || safeLongitude !== 0;
  
  // Construct URLs with validated coordinates only
  const openStreetMapUrl = hasValidCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${safeLongitude - 0.01},${safeLatitude - 0.01},${safeLongitude + 0.01},${safeLatitude + 0.01}&layer=mapnik&marker=${safeLatitude},${safeLongitude}`
    : '';
  const googleMapsUrl = hasValidCoordinates
    ? `https://www.google.com/maps?q=${safeLatitude},${safeLongitude}`
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Category Image */}
      <div className="relative bg-gradient-to-br from-primary/20 to-primary/10">
        <div className="h-64 flex items-center justify-center">
          {issue.thumbnail ? (
            <img src={issue.thumbnail} alt={issue.category} className="h-full w-full object-cover" />
          ) : (
            <span className="text-8xl">{categoryIcons[issue.category] || "📋"}</span>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className={`absolute top-12 ${isRTL ? 'right-6' : 'left-6'} w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg`}
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>

        <div className={`absolute bottom-4 ${isRTL ? 'right-6 left-6' : 'left-6 right-6'} flex items-center justify-between`}>
          {isEmployee ? (
            <Select value={issue.status} onValueChange={handleStatusChange}>
              <SelectTrigger className={`w-44 h-9 text-sm font-medium border-0 ${currentStatus.color}`}>
                <SelectValue placeholder={t('status.statusPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                <SelectItem value="under_review">{t('status.underReview')}</SelectItem>
                <SelectItem value="under_maintenance">{t('status.underMaintenance')}</SelectItem>
                <SelectItem value="resolved">{t('status.resolved')}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color}`}>
              {getStatusLabel(issue.status)}
            </span>
          )}
          {isEmployee && (
            <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
              {t('common.employeeView')}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Title & Meta */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-3">{issue.title}</h1>
          <div className="flex flex-col gap-2">
            {hasValidCoordinates && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm text-gray-800" dir="ltr">
                  {safeLatitude.toFixed(4)}, {safeLongitude.toFixed(4)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm text-gray-800">
                {t('issueDetails.reportedOn')}{" "}
                {new Date(issue.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-LB' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{t('issueDetails.description')}</h2>
          <p className="text-muted-foreground leading-relaxed text-gray-800">{issue.description}</p>
        </div>

        {/* Map with Google Maps Link - only show if coordinates are valid */}
        {hasValidCoordinates && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">{t('issueDetails.location')}</h2>
            <div className="rounded-2xl overflow-hidden shadow-sm border border-border">
              <iframe src={openStreetMapUrl} className="w-full h-48 border-0" title="Issue location map" />
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary mt-2 underline inline-block"
            >
              {t('common.openInGoogleMaps')} →
            </a>
            <p className="text-sm text-muted-foreground mt-1" dir="ltr">
              {t('common.coordinates')}: {safeLatitude.toFixed(4)}, {safeLongitude.toFixed(4)}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default IssueDetails;
