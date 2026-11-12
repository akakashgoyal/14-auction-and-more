import React, { useState } from 'react';
import { Property, AuthorityProperty, AuctionAsset } from '../types';
import { formatINR } from '../utils/storage';
import { getShareableUrl, getOfficialUrl, OFFICIAL_SITE_URL } from '../utils/routes';
import { useApi } from '../context/ApiContext';
import { getPropertyFallbackImage } from '../data/fallbackImages';
import { PropertyWatermark } from './PropertyWatermark';
import {
  X,
  Share2,
  Copy,
  Check,
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  Eye,
  MessageCircle,
  Mail,
  Send,
  FileText,
  ShieldCheck,
  Globe,
  ArrowRight,
  Layers,
  Recycle,
  Cog,
} from 'lucide-react';

export interface SharePropertyModalProps {
  property?: Property | null;
  authorityProperty?: AuthorityProperty | null;
  auctionAsset?: AuctionAsset | null;
  isOpen: boolean;
  onClose: () => void;
  customBaseUrl?: string;
  customShareUrl?: string;
  isWebsiteShare?: boolean;
}

export const SharePropertyModal: React.FC<SharePropertyModalProps> = ({
  property,
  authorityProperty,
  auctionAsset,
  isOpen,
  onClose,
  customBaseUrl,
  customShareUrl,
  isWebsiteShare = false,
}) => {
  const { settings } = useApi();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen) return null;

  const [useOfficialDomain, setUseOfficialDomain] = useState(false);

  // Determine active browser origin or official domain
  const currentBrowserOrigin = typeof window !== 'undefined' && window.location && window.location.origin
    ? window.location.origin.replace(/\/+$/, '')
    : OFFICIAL_SITE_URL;

  const isLocalhost = currentBrowserOrigin.includes('localhost') || currentBrowserOrigin.includes('127.0.0.1');

  // If on localhost or user specifically toggled official domain, use OFFICIAL_SITE_URL.
  // Otherwise use the active current deployment origin so LinkedIn/social crawlers inspect the live environment.
  const effectiveBaseUrl = (customBaseUrl && customBaseUrl.trim())
    ? customBaseUrl.replace(/\/+$/, '')
    : (useOfficialDomain || isLocalhost)
    ? OFFICIAL_SITE_URL
    : currentBrowserOrigin;

  const isPlatformShare = isWebsiteShare || (!property && !authorityProperty && !auctionAsset);

  // Determine unique URL to share
  let shareUrl = effectiveBaseUrl;
  if (customShareUrl) {
    shareUrl = getOfficialUrl(customShareUrl);
  } else if (property) {
    // Unique deterministic URL for the individual property with its Property ID
    shareUrl = getShareableUrl('property-detail', String(property.id), effectiveBaseUrl);
  } else if (authorityProperty) {
    shareUrl = getShareableUrl('authority-property-detail', String(authorityProperty.id), effectiveBaseUrl);
  } else if (auctionAsset) {
    shareUrl = getShareableUrl('auction-detail', String(auctionAsset.id), effectiveBaseUrl);
  }

  // Display Image resolution
  let displayImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';
  if (property) {
    displayImage =
      (property.images && property.images.length > 0 ? property.images[0] : '') ||
      getPropertyFallbackImage(property.propertyType);
  } else if (authorityProperty) {
    displayImage =
      authorityProperty.primary_image ||
      (authorityProperty.images && authorityProperty.images.length > 0 ? authorityProperty.images[0].image_url : '') ||
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';
  } else if (auctionAsset) {
    displayImage =
      auctionAsset.asset_image ||
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80';
  }

  // Location string
  let locationText = 'India';
  if (property) {
    const rawLocParts = [
      property.location?.locality?.trim(),
      property.location?.city?.trim(),
      property.location?.state?.trim(),
    ].filter(Boolean) as string[];
    const uniqueLocParts: string[] = [];
    rawLocParts.forEach((part) => {
      if (!uniqueLocParts.some((p) => p.toLowerCase() === part.toLowerCase())) {
        uniqueLocParts.push(part);
      }
    });
    locationText = uniqueLocParts.join(', ') || property?.location?.city || 'India';
  } else if (authorityProperty) {
    locationText = [authorityProperty.city_name, authorityProperty.state_name].filter(Boolean).join(', ') || 'India';
  } else if (auctionAsset) {
    locationText = [auctionAsset.city, auctionAsset.state].filter(Boolean).join(', ') || 'India';
  }

  // Title, Property ID, Reference Number & Lot Number
  let shareTitle = `${settings?.company_name || 'Auctions & More'} — India's Premier Distressed Asset Platform`;
  let propertyId: string | null = null;
  let referenceNo: string | null = null;
  let lotNo: string | null = null;
  let categoryLabel = 'Bank Auction';

  if (property) {
    shareTitle = `${property.title} | Verified Bank Auction Property`;
    propertyId = String(property.id);
    referenceNo = property.propertyReferenceNo || null;
    categoryLabel = property.auctionCategory ? `${property.auctionCategory} Auction` : property.propertyType || 'Bank Auction';
  } else if (authorityProperty) {
    shareTitle = `${authorityProperty.title} | ${authorityProperty.authority?.name || 'Authority Property'}`;
    propertyId = String(authorityProperty.id);
    referenceNo = authorityProperty.property_code || authorityProperty.reference_no || `AUTH-${authorityProperty.id}`;
    lotNo = authorityProperty.lot_no || 'Lot 1';
    categoryLabel = authorityProperty.authority?.name ? `Authority: ${authorityProperty.authority.name}` : 'Authority Property';
  } else if (auctionAsset) {
    shareTitle = `${auctionAsset.title} | ${auctionAsset.category || 'Auction Asset'}`;
    propertyId = String(auctionAsset.id);
    referenceNo = auctionAsset.reference_no;
    lotNo = auctionAsset.lot_no || (auctionAsset.quantity ? `${auctionAsset.quantity} ${auctionAsset.unit || ''}`.trim() : 'Lot 1');
    categoryLabel = auctionAsset.category || 'Industrial Asset';
  }

  // Clean, high-impact share message formatted with Property ID, Reference No, and Lot No
  const buildSimpleShortText = () => {
    if (isPlatformShare) {
      if (customShareUrl && customShareUrl.includes('authority')) {
        return (
          `🏛️ *Official Authority Properties & Land Auctions — ${settings?.company_name || 'Auctions & More'}*\n` +
          `Verified Statutory Development Authority Portals (DDA, HUDA, YEIDA, GMADA, UPSIDA & state bodies)\n` +
          `📍 Prime residential, commercial & industrial plots across India\n` +
          `🔗 Direct Portal: ${shareUrl}`
        );
      }
      return (
        `🏛️ *${settings?.company_name || 'Auctions & More'}*\n` +
        `Verified Bank Auctions, Authority Mandates & Distressed Properties\n` +
        `🔗 ${shareUrl}`
      );
    }

    const lines: string[] = [];
    if (property) {
      lines.push(`🏠 *${property.title.trim()}*`);
      lines.push(`🆔 Listing ID: ${property.id}`);
      if (property.propertyReferenceNo) {
        lines.push(`🏷️ Ref No: ${property.propertyReferenceNo}`);
      }
      lines.push(`📍 ${locationText}${property.propertyType ? ` • ${property.propertyType}` : ''}`);
      if (property.reservePrice > 0) {
        lines.push(`💰 Reserve: ${formatINR(property.reservePrice)}${property.emdAmount > 0 ? ` (EMD: ${formatINR(property.emdAmount)})` : ''}`);
      }
      if (property.auctionDate) {
        const d = new Date(property.auctionDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        lines.push(`📅 Auction Date: ${d}`);
      }
    } else if (authorityProperty) {
      lines.push(`🏛️ *${authorityProperty.title.trim()}*`);
      lines.push(`🆔 Listing ID: ${authorityProperty.id}`);
      if (referenceNo) {
        lines.push(`🏷️ Reference No: ${referenceNo}`);
      }
      if (lotNo) {
        lines.push(`📦 Lot No: ${lotNo}`);
      }
      if (authorityProperty.authority?.name) {
        lines.push(`🏢 Authority: ${authorityProperty.authority.name}`);
      }
      lines.push(`📍 Location: ${locationText}`);
      if (authorityProperty.reserve_price && authorityProperty.reserve_price > 0) {
        lines.push(`💰 Reserve: ${formatINR(authorityProperty.reserve_price)}${authorityProperty.emd_amount ? ` (EMD: ${formatINR(authorityProperty.emd_amount)})` : ''}`);
      }
      if (authorityProperty.auction_start_at) {
        try {
          const d = new Date(authorityProperty.auction_start_at.trim().replace(' ', 'T'));
          if (!isNaN(d.getTime())) {
            lines.push(`📅 Auction Date: ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
          }
        } catch {
          // ignore
        }
      }
    } else if (auctionAsset) {
      lines.push(`⚙️ *${auctionAsset.title.trim()}*`);
      lines.push(`🆔 Listing ID: ${auctionAsset.id}`);
      if (referenceNo) {
        lines.push(`🏷️ Reference No: ${referenceNo}`);
      }
      if (lotNo) {
        lines.push(`📦 Lot No: ${lotNo}`);
      }
      lines.push(`📍 Location: ${locationText}`);
      const rNum = Number(auctionAsset.reserve_price);
      if (!isNaN(rNum) && rNum > 0) {
        lines.push(`💰 Reserve: ${formatINR(rNum)}`);
      }
    }

    lines.push(`🔗 Direct Link: ${shareUrl}`);
    return lines.join('\n');
  };

  const shareCardText = buildSimpleShortText();

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleCopyFormattedText = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareCardText);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareCardText)}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(
      authorityProperty
        ? `Verified Authority Property: ${authorityProperty.title}`
        : isPlatformShare
        ? customShareUrl && customShareUrl.includes('authority')
          ? `Verified Statutory Development Authority Properties — ${settings?.company_name || 'Auctions & More'}`
          : `Verified Distressed Asset Platform: ${settings?.company_name || 'Auctions & More'}`
        : `Verified Bank Auction Asset: ${property?.title || 'Auctions & More'}`
    );
    const body = encodeURIComponent(shareCardText);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareCardText)}`, '_blank');
  };

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleTelegramShare = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareCardText)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareCardText, // Crucial: contains the embedded link so messaging apps retain the URL
          url: shareUrl,
        });
      } catch {
        // Dismissed by user
      }
    } else {
      handleCopyFormattedText();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E2DDD2] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#142533] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-[#D89B30] flex items-center justify-center shrink-0 border border-white/10">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#D89B30]">
                <span>
                  {authorityProperty
                    ? 'Statutory Authority Mandate'
                    : isPlatformShare
                    ? customShareUrl && customShareUrl.includes('authority')
                      ? 'Statutory Authority Portal'
                      : 'Institutional Advisory'
                    : 'Verified Auction Mandate'}
                </span>
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white leading-tight">
                {authorityProperty
                  ? 'Share Authority Property'
                  : isPlatformShare
                  ? customShareUrl && customShareUrl.includes('authority')
                    ? 'Share Authority Properties Section'
                    : 'Share Auctions & More Platform'
                  : 'Share Property Card'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Card Label */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>Concise Property Card Preview</span>
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Link Embedded in Share Text</span>
            </span>
          </div>

          {/* CONCISE REAL-ESTATE PROPERTY CARD (Clean, compact, no clutter) */}
          <div className="rounded-2xl border border-[#E2DDD2] bg-white overflow-hidden shadow-md group hover:border-[#D89B30]/50 transition-all">
            {/* Visual Header / Property Image */}
            <div className="relative aspect-16/9 w-full bg-slate-900 overflow-hidden">
              <img
                src={displayImage}
                alt={authorityProperty ? authorityProperty.title : property ? property.title : 'Auctions & More'}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 pointer-events-none" />

              {/* Watermark in Top Right */}
              <PropertyWatermark variant="corner" position="top-right" size="sm" />

              {/* Category / Type Badge on Top Left */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#142533]/90 backdrop-blur-xs text-[#D89B30] text-[10px] font-mono font-bold border border-white/15 shadow-xs">
                  {authorityProperty
                    ? authorityProperty.authority?.short_name || authorityProperty.authority?.name
                      ? `Authority: ${authorityProperty.authority.short_name || authorityProperty.authority.name}`
                      : 'Authority Property'
                    : property
                    ? property.auctionCategory
                      ? `${property.auctionCategory} Auction`
                      : property.propertyType || 'Bank Auction'
                    : customShareUrl && customShareUrl.includes('authority')
                    ? 'Statutory Authority Section'
                    : 'Bank Auction Platform'}
                </span>
                {authorityProperty?.property_type && (
                  <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold border border-white/10 hidden sm:inline-block">
                    {authorityProperty.property_type}
                  </span>
                )}
                {!authorityProperty && property?.propertySubType && (
                  <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold border border-white/10 hidden sm:inline-block">
                    {property.propertySubType}
                  </span>
                )}
              </div>

              {/* Location Strip on Bottom */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 text-white text-xs drop-shadow-md truncate">
                <MapPin className="w-3.5 h-3.5 text-[#D89B30] shrink-0" />
                <span className="truncate font-medium">{locationText}</span>
              </div>
            </div>

            {/* Concise Details & Specs */}
            <div className="p-4 space-y-3 bg-gradient-to-b from-white to-[#FAF8F5]">
              <div>
                <h4 className="font-serif text-sm sm:text-base font-bold text-[#142533] line-clamp-2 leading-snug group-hover:text-[#9A6007] transition-colors">
                  {authorityProperty
                    ? authorityProperty.title
                    : property
                    ? property.title
                    : customShareUrl && customShareUrl.includes('authority')
                    ? 'Verified Statutory Authority Properties & Land Schemes'
                    : "Auctions & More — India's Premier Distressed Asset Platform"}
                </h4>
              </div>

              {/* Compact Real Estate Metrics Grid */}
              {authorityProperty ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Reserve Price</span>
                    <span className="text-sm font-extrabold text-[#142533] font-mono">
                      {authorityProperty.reserve_price ? formatINR(authorityProperty.reserve_price) : 'On Request'}
                    </span>
                  </div>

                  {authorityProperty.emd_amount ? (
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">EMD Amount</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">
                        {formatINR(authorityProperty.emd_amount)}
                      </span>
                    </div>
                  ) : authorityProperty.area ? (
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">Plot Area</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">
                        {authorityProperty.area} {authorityProperty.area_unit || ''}
                      </span>
                    </div>
                  ) : null}

                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Authority</span>
                    <span className="text-xs font-bold text-[#9A6007] truncate block">
                      {authorityProperty.authority?.short_name || authorityProperty.authority?.name || 'Statutory Body'}
                    </span>
                  </div>
                </div>
              ) : property ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Reserve Price</span>
                    <span className="text-sm font-extrabold text-[#142533] font-mono">
                      {property.reservePrice > 0 ? formatINR(property.reservePrice) : 'On Request'}
                    </span>
                  </div>

                  {property.emdAmount > 0 && (
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">EMD (10%)</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">
                        {formatINR(property.emdAmount)}
                      </span>
                    </div>
                  )}

                  {property.auctionDate ? (
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">Auction Date</span>
                      <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#9A6007]" />
                        <span>
                          {new Date(property.auctionDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">Title Status</span>
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    </div>
                  )}
                </div>
              ) : customShareUrl && customShareUrl.includes('authority') ? (
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Authorities Covered</span>
                    <span className="text-xs font-bold text-[#142533]">DDA, HUDA, YEIDA &amp; State Bodies</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Asset Classes</span>
                    <span className="text-xs font-bold text-[#142533]">Plots, Housing Schemes &amp; Land</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Mandates</span>
                    <span className="text-xs font-bold text-[#142533]">₹500+ Cr Prime Assets</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Banks Covered</span>
                    <span className="text-xs font-bold text-[#142533]">Top PSU &amp; Private Banks</span>
                  </div>
                </div>
              )}

              {/* PROMINENT REDIRECT BUTTON (Never plain text, real clickable redirect button) */}
              <div className="pt-1">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#142533] hover:bg-[#1E3A52] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md group/btn cursor-pointer"
                  title="Click to redirect and view complete property details & documents"
                >
                  <Eye className="w-4 h-4 text-[#D89B30]" />
                  <span>
                    {authorityProperty
                      ? 'View Complete Authority Property Details'
                      : property
                      ? 'View Complete Property Details'
                      : customShareUrl && customShareUrl.includes('authority')
                      ? 'Explore Authority Properties Section'
                      : 'Explore Auctions & More Website'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* Simple Short Share Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Short Share Text
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                Simple &amp; Short
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2DDD2] text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed selection:bg-[#D89B30]/30 select-all">
              {shareCardText}
            </div>
          </div>

          {/* Quick Direct Link & Redirect Action Strip */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Direct Link &amp; Navigation
            </span>
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#FAF8F5] border border-[#E2DDD2]">
              <span className="flex-1 font-mono text-xs text-slate-700 px-2.5 truncate select-all">
                {shareUrl}
              </span>

              {/* Direct Redirect Button */}
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#142533] font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                title="Redirect to property in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#D89B30]" />
                <span>Redirect</span>
              </a>

              {/* Copy Link Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#142533] hover:bg-[#1E3A52] text-white'
                }`}
                title="Copy URL only"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Share to Platform (Link Included in Text)
            </span>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Share on WhatsApp</span>
              </button>

              {/* LinkedIn Share Button (Opens official LinkedIn share with property Open Graph metadata) */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer group"
                title="Share this listing on LinkedIn (Includes Title, Image, Description, and Listing ID)"
              >
                <span className="w-5 h-5 rounded bg-white text-[#0A66C2] text-xs font-black flex items-center justify-center">in</span>
                <span>Share on LinkedIn</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-200 group-hover:text-white transition-colors" />
              </a>
            </div>

            {/* LinkedIn Open Graph Status & Post Inspector Test */}
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-medium">
                  <strong>Open Graph Dynamic Tags Active:</strong> Title, Image, ID #{propertyId || 'Asset'}, Price &amp; URL
                </span>
              </div>
              <a
                href={`https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono font-bold text-[#0A66C2] hover:text-[#004182] flex items-center gap-1 underline underline-offset-2 shrink-0 cursor-pointer"
                title="Test and preview how LinkedIn crawler renders this property"
              >
                <span>LinkedIn Inspector</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {/* Other Channels Row */}
            <div className="grid grid-cols-3 gap-2">
              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegramShare}
                className="py-2.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 transition-all flex flex-col items-center justify-center gap-1 text-[11px] font-bold cursor-pointer"
                title="Share via Telegram"
              >
                <Send className="w-4 h-4 text-sky-600" />
                <span>Telegram</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={handleEmailShare}
                className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 transition-all flex flex-col items-center justify-center gap-1 text-[11px] font-bold cursor-pointer"
                title="Share via Email"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email</span>
              </button>

              {/* Twitter / 𝕏 */}
              <button
                type="button"
                onClick={handleTwitterShare}
                className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 transition-all flex flex-col items-center justify-center gap-1 text-[11px] font-bold cursor-pointer"
                title="Share on Twitter / X"
              >
                <span className="text-xs font-bold">𝕏</span>
                <span>Twitter / X</span>
              </button>
            </div>

            {/* Action Row: Copy Full Text with Embedded Link & Native Share */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyFormattedText}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  copiedSummary
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
                title="Copies complete property details text with the link embedded inside"
              >
                {copiedSummary ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{copiedSummary ? 'Short Text Copied!' : 'Copy Short Text with Link'}</span>
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2.5 px-3.5 rounded-xl bg-[#FAF1DE] hover:bg-[#F5E5C4] border border-[#F3DFB4] text-[#9A6007] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Share using native app picker"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>More</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF8F5] border-t border-[#E8E2D5] px-4 sm:px-5 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px] font-mono text-slate-400">
            Auctions &amp; More Verified Share
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-slate-700 hover:text-[#142533] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
