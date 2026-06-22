import { useState, useCallback } from 'react';
import { geminiService } from '@/services/gemini.service';
import { toast } from 'sonner';

interface UseGeminiAIReturn {
  enhanceDescription: (title: string, subtitle?: string, description?: string) => Promise<string | null>;
  generateDescription: (title: string, subtitle?: string) => Promise<string | null>;
  improveDescription: (currentDescription: string, title: string, subtitle?: string) => Promise<string | null>;
  generateLearningObjectives: (title: string, subtitle?: string, description?: string) => Promise<string[] | null>;
  generatePrerequisites: (title: string, subtitle?: string, courseLevel?: string) => Promise<string | null>;
  generateTargetAudience: (title: string, subtitle?: string, courseLevel?: string) => Promise<string | null>;
  isLoading: boolean;
  isGeneratingObjectives: boolean;
  isGeneratingPrerequisites: boolean;
  isGeneratingTargetAudience: boolean;
  error: string | null;
}

export const useGeminiAI = (): UseGeminiAIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingObjectives, setIsGeneratingObjectives] = useState(false);
  const [isGeneratingPrerequisites, setIsGeneratingPrerequisites] = useState(false);
  const [isGeneratingTargetAudience, setIsGeneratingTargetAudience] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhanceDescription = useCallback(async (
    title: string, 
    subtitle?: string, 
    description?: string
  ): Promise<string | null> => {
    if (!title.trim()) {
      toast.error('Please enter a course title first');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const enhancedDescription = await geminiService.enhanceDescription(title, subtitle, description);
      toast.success('Description enhanced successfully!');
      return enhancedDescription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enhance description';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateDescription = useCallback(async (
    title: string, 
    subtitle?: string
  ): Promise<string | null> => {
    if (!title.trim()) {
      toast.error('Please enter a course title first');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const generatedDescription = await geminiService.generateDescription(title, subtitle);
      toast.success('Description generated successfully!');
      return generatedDescription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate description';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const improveDescription = useCallback(async (
    currentDescription: string,
    title: string, 
    subtitle?: string
  ): Promise<string | null> => {
    if (!title.trim()) {
      toast.error('Please enter a course title first');
      return null;
    }

    if (!currentDescription.trim()) {
      toast.error('Please enter a description to improve');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const improvedDescription = await geminiService.improveDescription(currentDescription, title, subtitle);
      toast.success('Description improved successfully!');
      return improvedDescription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to improve description';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateLearningObjectives = useCallback(async (
    title: string,
    subtitle?: string,
    description?: string
  ): Promise<string[] | null> => {
    if (!title.trim()) {
      toast.error('Please enter a course title first');
      return null;
    }

    setIsGeneratingObjectives(true);
    setError(null);

    try {
      const objectives = await geminiService.generateLearningObjectives(title, subtitle, description);
      toast.success('Learning objectives generated successfully!');
      return objectives;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate learning objectives';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGeneratingObjectives(false);
    }
  }, []);

  const generatePrerequisites = useCallback(async (
    title: string,
    subtitle?: string,
    courseLevel?: string
  ): Promise<string | null> => {
    if (!title.trim()) {
      toast.error('Please enter a course title first');
      return null;
    }

    setIsGeneratingPrerequisites(true);
    setError(null);

    try {
      const prerequisites = await geminiService.generatePrerequisites(title, subtitle, courseLevel);
      toast.success('Prerequisites generated successfully!');
      return prerequisites;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate prerequisites';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGeneratingPrerequisites(false);
    }
  }, []);

  const generateTargetAudience = useCallback(async (
    title: string,
    subtitle?: string,
    courseLevel?: string
  ): Promise<string | null> => {
    if (!title.trim()) {
      toast.error('Please enter a course title first');
      return null;
    }

    setIsGeneratingTargetAudience(true);
    setError(null);

    try {
      const targetAudience = await geminiService.generateTargetAudience(title, subtitle, courseLevel);
      toast.success('Target audience generated successfully!');
      return targetAudience;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate target audience';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGeneratingTargetAudience(false);
    }
  }, []);

  return {
    enhanceDescription,
    generateDescription,
    improveDescription,
    generateLearningObjectives,
    generatePrerequisites,
    generateTargetAudience,
    isLoading,
    isGeneratingObjectives,
    isGeneratingPrerequisites,
    isGeneratingTargetAudience,
    error
  };
};
