# User Rules for Trae AI Development

## Personal Development Preferences

### Code Style Preferences
- **Language**: Use English for all code comments, variable names, and documentation
- **Naming Convention**: Use descriptive, self-documenting variable and function names
- **Code Comments**: Add comments for complex business logic and non-obvious implementations
- **Error Messages**: Provide clear, actionable error messages for users
- **Console Logging**: Use structured logging with appropriate log levels (info, warn, error)

### TypeScript Preferences
- **Type Safety**: Gradually increase TypeScript strictness as project matures
- **Interface vs Type**: Prefer interfaces for object shapes, types for unions and primitives
- **Generic Usage**: Use generics for reusable components and utility functions
- **Type Imports**: Use `import type` for type-only imports to improve build performance

### React Development Style
- **Component Structure**: Prefer functional components with hooks over class components
- **State Management**: Use local state for component-specific data, context for shared state
- **Effect Dependencies**: Always include all dependencies in useEffect dependency arrays
- **Custom Hooks**: Extract reusable logic into custom hooks for better organization
- **Component Props**: Use destructuring for props and provide default values when appropriate

### Code Organization Preferences
- **File Naming**: Use PascalCase for components, camelCase for utilities and hooks
- **Import Order**: Group imports (React, third-party, local) with blank lines between groups
- **Export Style**: Use named exports for utilities, default exports for main components
- **Folder Structure**: Group related files together, avoid deeply nested folder structures

### Database & API Preferences
- **Query Optimization**: Always consider performance implications of database queries
- **Error Handling**: Implement comprehensive error handling for all API calls
- **Data Validation**: Validate data at API boundaries using schema validation (Zod)
- **Caching Strategy**: Use appropriate caching for frequently accessed data

### UI/UX Preferences
- **Responsive Design**: Always implement mobile-first responsive design
- **Accessibility**: Include proper ARIA labels and keyboard navigation support
- **Loading States**: Provide clear loading indicators for async operations
- **User Feedback**: Show success/error messages for user actions
- **Performance**: Optimize for fast initial page load and smooth interactions

### Testing Preferences
- **Test Coverage**: Focus on testing critical business logic and user flows
- **Test Data**: Use realistic test data that represents actual use cases
- **Error Scenarios**: Test both success and failure scenarios
- **User Roles**: Test different user permission levels and subscription tiers

### Security Mindset
- **Data Privacy**: Always consider user data privacy in implementation decisions
- **Input Validation**: Validate and sanitize all user inputs
- **Authentication**: Implement proper authentication and authorization checks
- **Secrets Management**: Never hardcode secrets or API keys in source code

### Performance Considerations
- **Bundle Size**: Monitor and optimize JavaScript bundle size
- **Image Optimization**: Use appropriate image formats and sizes
- **Database Queries**: Optimize database queries and use indexes effectively
- **Caching**: Implement appropriate caching strategies for better performance

### Development Workflow
- **Git Commits**: Use clear, descriptive commit messages following conventional commits
- **Code Reviews**: Focus on code quality, security, and maintainability in reviews
- **Documentation**: Keep documentation up-to-date with code changes
- **Refactoring**: Regularly refactor code to improve readability and maintainability

### Communication Style
- **Code Comments**: Write comments that explain 'why' not 'what'
- **Variable Names**: Use business domain language in variable and function names
- **Error Messages**: Provide helpful error messages that guide users to solutions
- **Documentation**: Write documentation from the user's perspective

### Learning & Growth
- **Stay Updated**: Keep up with React, TypeScript, and web development best practices
- **Experiment**: Try new tools and techniques in development environment first
- **Share Knowledge**: Document learnings and share with team members
- **Code Quality**: Continuously improve code quality and development practices

### Tool Preferences
- **IDE**: Optimize for Visual Studio Code with appropriate extensions
- **Debugging**: Use browser dev tools and React Developer Tools effectively
- **Version Control**: Use Git with clear branching strategy and meaningful commits
- **Package Management**: Prefer npm for consistency with project setup

### Project Management
- **Task Breakdown**: Break large features into smaller, manageable tasks
- **Priority Focus**: Focus on user-facing features and critical bug fixes first
- **Technical Debt**: Address technical debt regularly to maintain code quality
- **Documentation**: Maintain clear documentation for setup and deployment procedures

---

## Quick Preferences Summary

- **Language**: English for all development artifacts
- **Code Style**: Clean, readable, self-documenting code
- **TypeScript**: Gradual adoption with increasing strictness
- **React**: Functional components with hooks
- **Testing**: Focus on critical paths and user flows
- **Security**: Privacy-first approach with proper validation
- **Performance**: Mobile-first, optimized for speed
- **Documentation**: User-focused, up-to-date documentation

These preferences guide development decisions and ensure consistent, high-quality code across all projects.