import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('VITE_GEMINI_API_KEY is not set. AI features will not work.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  // Helper method to clean up AI response formatting
  private cleanAIResponse(response: string): string {
    // Remove markdown code block formatting
    let cleaned = response.trim();

    // Remove ```html at the beginning
    if (cleaned.startsWith('```html')) {
      cleaned = cleaned.substring(7);
    }

    // Remove ```json at the beginning
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    }

    // Remove ``` at the beginning (in case it's just ```)
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }

    // Remove "json" at the beginning if it exists
    if (cleaned.startsWith('json')) {
      cleaned = cleaned.substring(4);
    }

    // Remove ``` at the end
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    // Remove any leading/trailing whitespace again
    return cleaned.trim();
  }

  // Fallback method to extract objectives from text when JSON parsing fails
  private extractObjectivesFromText(text: string): string[] {
    const objectives: string[] = [];

    // Try to find lines that look like objectives
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) continue;

      // Look for lines that start with quotes, bullets, or numbers
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
        trimmed.startsWith('•') ||
        trimmed.startsWith('-') ||
        trimmed.startsWith('*') ||
        /^\d+\./.test(trimmed)
      ) {
        // Clean up the objective text
        let objective = trimmed
          .replace(/^["']|["']$/g, '') // Remove quotes
          .replace(/^[•\-*]\s*/, '') // Remove bullets
          .replace(/^\d+\.\s*/, '') // Remove numbers
          .trim();

        if (objective.length > 10) { // Only add if it's substantial
          objectives.push(objective);
        }
      }
    }

    return objectives;
  }

  async enhanceDescription(title: string, subtitle?: string, description?: string): Promise<string> {
    try {
      const prompt = `
        You are an expert course description writer for premium online learning platforms like Udemy, Coursera, and MasterClass.
        
        Course Title: "${title}"
        ${subtitle ? `Subtitle: "${subtitle}"` : ''}
        ${description ? `Current Description: "${description}"` : ''}
        
        Create a compelling, professional course description that:
        
        STRUCTURE:
        1. Hook: Start with a powerful opening that addresses the learner's pain point or aspiration
        2. What You'll Learn: 4-6 specific, measurable learning outcomes
        3. Course Content: Brief overview of key topics and methodologies
        4. Who This Is For: Target audience and prerequisites
        5. Why Choose This Course: Unique value proposition and instructor credibility
        6. Call to Action: Motivational closing statement
        
        REQUIREMENTS:
        - 300-500 words total
        - Use specific technologies, tools, and methodologies mentioned in the title
        - Include measurable outcomes and real-world applications
        - Emphasize career advancement and industry relevance
        - Use active voice and action-oriented language
        - Avoid generic phrases and focus on unique value
        - Include social proof elements when relevant
        - Format with proper HTML tags for rich text display
        
        FORMATTING:
        - Use <h3> for section headers
        - Use <ul> and <li> for bullet points
        - Use <strong> for emphasis
        - Use <p> for paragraphs
        - Ensure proper HTML structure
        
        TONE: Professional, confident, results-focused, inspiring
        
        Return only the formatted HTML description, no quotes or explanations.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.cleanAIResponse(response.text());
    } catch (error) {
      console.error('Gemini description enhancement error:', error);
      throw new Error('Failed to enhance description with AI');
    }
  }

  async generateDescription(title: string, subtitle?: string): Promise<string> {
    try {
      const prompt = `
        You are an expert course description writer for premium online learning platforms.
        
        Course Title: "${title}"
        ${subtitle ? `Subtitle: "${subtitle}"` : ''}
        
        Create a compelling, professional course description from scratch that:
        
        STRUCTURE:
        1. Hook: Start with a powerful opening that addresses the learner's pain point
        2. What You'll Learn: 5-7 specific, measurable learning outcomes
        3. Course Content: Overview of key topics and practical projects
        4. Who This Is For: Target audience description
        5. Why Choose This Course: Unique value proposition
        6. Call to Action: Motivational closing
        
        REQUIREMENTS:
        - 350-450 words total
        - Infer content from the title and subtitle
        - Include specific technologies and tools
        - Emphasize practical, hands-on learning
        - Mention real-world projects and portfolio building
        - Use industry-relevant keywords
        - Format with proper HTML tags
        
        FORMATTING:
        - Use <h3> for section headers
        - Use <ul> and <li> for learning outcomes
        - Use <strong> for key terms
        - Use <p> for paragraphs
        - Ensure clean HTML structure
        
        TONE: Professional, exciting, results-oriented
        
        Return only the formatted HTML description.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.cleanAIResponse(response.text());
    } catch (error) {
      console.error('Gemini description generation error:', error);
      throw new Error('Failed to generate description with AI');
    }
  }

  async improveDescription(currentDescription: string, title: string, subtitle?: string): Promise<string> {
    try {
      const prompt = `
        You are an expert course description optimizer for online learning platforms.
        
        Course Title: "${title}"
        ${subtitle ? `Subtitle: "${subtitle}"` : ''}
        Current Description: "${currentDescription}"
        
        Improve the existing description by:
        
        ENHANCEMENTS:
        - Making it more engaging and compelling
        - Adding specific learning outcomes if missing
        - Improving clarity and readability
        - Adding industry-relevant keywords
        - Enhancing the value proposition
        - Improving the structure and flow
        - Adding HTML formatting for better presentation
        
        MAINTAIN:
        - The core message and intent
        - Any specific details already mentioned
        - The approximate length (300-500 words)
        
        FORMATTING:
        - Use proper HTML tags (<h3>, <p>, <ul>, <li>, <strong>)
        - Ensure clean, semantic HTML structure
        - Make it visually appealing when rendered
        
        Return only the improved HTML description.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.cleanAIResponse(response.text());
    } catch (error) {
      console.error('Gemini description improvement error:', error);
      throw new Error('Failed to improve description with AI');
    }
  }

  async generateLearningObjectives(title: string, subtitle?: string, description?: string): Promise<string[]> {
    try {
      const prompt = `
        You are an expert course curriculum designer for online learning platforms.

        Course Title: "${title}"
        ${subtitle ? `Subtitle: "${subtitle}"` : ''}
        ${description ? `Description: "${description}"` : ''}

        Generate 5-7 specific, measurable learning objectives for this course that:

        REQUIREMENTS:
        - Start with action verbs (Build, Create, Implement, Master, Understand, Analyze, etc.)
        - Be specific and measurable
        - Focus on practical skills and knowledge
        - Be relevant to the course title and content
        - Progress from basic to advanced concepts
        - Include real-world applications

        EXAMPLES:
        - "Build a complete e-commerce website using React and Node.js"
        - "Implement user authentication and authorization systems"
        - "Master advanced JavaScript concepts like closures and async programming"
        - "Create responsive designs using CSS Grid and Flexbox"
        - "Deploy applications to cloud platforms like AWS or Heroku"

        Return ONLY a JSON array of strings, no explanations or formatting.
        Example: ["Objective 1", "Objective 2", "Objective 3"]
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let cleanedResponse = this.cleanAIResponse(response.text());

      // Additional cleaning for JSON responses
      cleanedResponse = cleanedResponse
        .replace(/^json\s*/i, '') // Remove "json" at the start (case insensitive)
        .replace(/^\s*\[/, '[') // Ensure it starts with [
        .replace(/\]\s*$/, ']'); // Ensure it ends with ]

      try {
        const objectives = JSON.parse(cleanedResponse);
        if (Array.isArray(objectives)) {
          // Filter out empty strings and ensure we have valid objectives
          const validObjectives = objectives.filter(obj =>
            typeof obj === 'string' && obj.trim().length > 0
          );
          return validObjectives.length > 0 ? validObjectives : [];
        } else {
          throw new Error('Response is not an array');
        }
      } catch (parseError) {
        console.error('Failed to parse learning objectives JSON:', parseError);
        console.error('Cleaned response was:', cleanedResponse);

        // Fallback: try to extract objectives from text manually
        try {
          const fallbackObjectives = this.extractObjectivesFromText(cleanedResponse);
          if (fallbackObjectives.length > 0) {
            return fallbackObjectives;
          }
        } catch (fallbackError) {
          console.error('Fallback extraction also failed:', fallbackError);
        }

        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error('Gemini learning objectives generation error:', error);
      throw new Error('Failed to generate learning objectives with AI');
    }
  }

  async generatePrerequisites(title: string, subtitle?: string, courseLevel?: string): Promise<string> {
    try {
      const prompt = `
        You are an expert course curriculum designer for online learning platforms.

        Course Title: "${title}"
        ${subtitle ? `Subtitle: "${subtitle}"` : ''}
        ${courseLevel ? `Course Level: "${courseLevel}"` : ''}

        Generate appropriate prerequisites for this course that:

        REQUIREMENTS:
        - Be specific and realistic
        - Match the course level (Beginner courses need fewer prerequisites)
        - Include both technical and soft skills if relevant
        - Be concise but comprehensive
        - Use bullet points for clarity
        - Consider the target audience and course complexity

        EXAMPLES:
        For a React course:
        "• Basic knowledge of HTML, CSS, and JavaScript
        • Understanding of ES6+ features (arrow functions, destructuring, modules)
        • Familiarity with command line/terminal
        • Basic understanding of web development concepts"

        For a beginner course:
        "• No prior experience required - perfect for complete beginners
        • Basic computer literacy and internet navigation skills
        • Willingness to learn and practice regularly"

        Return only the prerequisites text with bullet points, no explanations.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.cleanAIResponse(response.text());
    } catch (error) {
      console.error('Gemini prerequisites generation error:', error);
      throw new Error('Failed to generate prerequisites with AI');
    }
  }

  async searchSustainability(
    query: string,
    history: Array<{ role: 'user' | 'assistant'; text: string }> = []
  ): Promise<{ answer: string; topics: string[]; suggestedSearchTerms: string[] }> {
    try {
      const conversationContext = history.length
        ? `\nPrevious conversation:\n${history
            .slice(-4)
            .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
            .join('\n')}\n`
        : '';

      const prompt = `
You are the GreenUniMind AI — a sustainability education expert for a green university learning platform.
Your purpose is to answer questions about sustainability, environmental science, climate action, the UN Sustainable Development Goals (SDGs), renewable energy, circular economy, biodiversity, green technology, ESG, corporate sustainability, and related topics.

FOCUS AREAS: Climate Change, SDGs, Renewable Energy, Circular Economy, Biodiversity, Green Technology, Sustainable Agriculture, Water Conservation, Carbon Footprint, ESG Investing, Environmental Policy, Eco-Innovation, Waste Management, Sustainable Fashion, Green Building.

RULES:
- Give concise, educational answers (2-3 short paragraphs max).
- Use **bold** for key terms and bullet points where helpful.
- End with a brief actionable takeaway or learning tip.
- If the question is unrelated to sustainability/environment, politely redirect: "That's outside my expertise. I focus on sustainability and environmental topics — try asking about climate action, SDGs, or green technology!"
${conversationContext}
User question: "${query}"

Respond with ONLY valid JSON (no markdown fences):
{
  "answer": "<your answer as HTML with <p>, <strong>, <ul>, <li> tags>",
  "topics": ["topic1", "topic2"],
  "suggestedSearchTerms": ["term for course search 1", "term 2", "term 3"]
}

The "suggestedSearchTerms" should be 2-4 short keywords/phrases a student might use to find related courses on this platform (e.g. "renewable energy", "climate change basics", "SDG goals").
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const cleaned = this.cleanAIResponse(response.text());

      try {
        return JSON.parse(cleaned);
      } catch {
        return {
          answer: cleaned,
          topics: [],
          suggestedSearchTerms: [query],
        };
      }
    } catch (error) {
      console.error('Gemini sustainability search error:', error);
      throw new Error('Failed to search sustainability content');
    }
  }

  async generateTargetAudience(title: string, subtitle?: string, courseLevel?: string): Promise<string> {
    try {
      const prompt = `
        You are an expert course curriculum designer for online learning platforms.

        Course Title: "${title}"
        ${subtitle ? `Subtitle: "${subtitle}"` : ''}
        ${courseLevel ? `Course Level: "${courseLevel}"` : ''}

        Generate a clear target audience description for this course that:

        REQUIREMENTS:
        - Be specific about who would benefit most
        - Include skill levels, job roles, or career stages
        - Mention specific goals or outcomes they're seeking
        - Be encouraging and inclusive
        - Use bullet points for clarity
        - Consider the course level and content

        EXAMPLES:
        For a React course:
        "• Frontend developers looking to master modern React development
        • JavaScript developers wanting to learn component-based architecture
        • Web developers transitioning from jQuery or vanilla JavaScript
        • Computer science students preparing for frontend development roles
        • Career changers entering the tech industry"

        For a beginner course:
        "• Complete beginners with no prior programming experience
        • Career changers looking to enter the tech industry
        • Students wanting to build a strong foundation in programming
        • Professionals looking to add technical skills to their toolkit
        • Anyone curious about coding and wanting to start their journey"

        Return only the target audience text with bullet points, no explanations.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.cleanAIResponse(response.text());
    } catch (error) {
      console.error('Gemini target audience generation error:', error);
      throw new Error('Failed to generate target audience with AI');
    }
  }
}

export const geminiService = new GeminiService();
