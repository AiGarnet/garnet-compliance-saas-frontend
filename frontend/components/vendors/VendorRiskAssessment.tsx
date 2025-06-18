"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, CheckCircle, Clock, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { vendors } from '@/lib/api';

interface RiskFactor {
  factor: string;
  score: number;
  weight: number;
  details: string;
}

interface RiskAssessment {
  overallScore: number;
  riskLevel: string;
  factors: RiskFactor[];
  recommendations: string[];
  lastAssessed: string;
}

interface VendorRiskAssessmentProps {
  vendorId: string;
  className?: string;
}

export function VendorRiskAssessment({ vendorId, className = '' }: VendorRiskAssessmentProps) {
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskAssessment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await vendors.risk.getAssessment(vendorId);
        setRiskAssessment(response.assessment);
      } catch (err: any) {
        console.error('Failed to fetch risk assessment:', err);
        setError(err.message || 'Failed to load risk assessment');
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchRiskAssessment();
    }
  }, [vendorId]);

  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return <Shield className="h-5 w-5 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getFactorScoreColor = (score: number) => {
    if (score <= 30) return 'text-green-600';
    if (score <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!riskAssessment) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Info className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No risk assessment available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getRiskIcon(riskAssessment.riskLevel)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
              <p className="text-sm text-gray-500">
                Last assessed: {new Date(riskAssessment.lastAssessed).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(riskAssessment.riskLevel)}`}>
              {riskAssessment.riskLevel} Risk
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {riskAssessment.overallScore}/100
            </div>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Risk Factors</h4>
        <div className="space-y-4">
          {riskAssessment.factors?.map((factor, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{factor.factor}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Weight: {(factor.weight * 100).toFixed(0)}%</span>
                  <span className={`font-semibold ${getFactorScoreColor(factor.score)}`}>
                    {factor.score}/100
                  </span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${
                    factor.score <= 30 ? 'bg-green-500' :
                    factor.score <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${factor.score}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-600">{factor.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {riskAssessment.recommendations?.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-blue-50">
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {riskAssessment.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 