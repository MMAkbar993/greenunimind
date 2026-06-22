/**
 * Utility function to extract the correct user ID from the user object
 *
 * The user object can have different structures depending on where it comes from:
 * - From the User model directly: user._id
 * - From the Student/Teacher model with populated user: user.user._id
 * - From the Student/Teacher model with user ID: user.user
 * - From the /users/me API response: user.data._id or user.data.user._id
 *
 * This function handles all these cases and returns the correct MongoDB ObjectId
 */
export const getUserId = (user: any): string | null => {
  if (!user) {
    console.warn('getUserId called with null or undefined user');
    return null;
  }

  // Log the user object structure for debugging
  console.debug('getUserId analyzing user object:', JSON.stringify({
    hasId: !!user._id,
    hasUserId: !!user.userId,
    hasNestedUser: !!user.user,
    nestedUserType: user.user ? typeof user.user : 'none',
    hasData: !!user.data,
    dataType: user.data ? typeof user.data : 'none',
    userKeys: Object.keys(user)
  }));

  // Case 1: Direct user._id (most common)
  if (user._id) {
    console.debug('getUserId found direct _id:', user._id);
    return user._id;
  }

  // Case 2: userId field (sometimes used in frontend)
  if (user.userId) {
    console.debug('getUserId found userId:', user.userId);
    return user.userId;
  }

  // Case 3: Nested user object (from populated queries)
  if (user.user && typeof user.user === 'object' && user.user._id) {
    console.debug('getUserId found nested user._id:', user.user._id);
    return user.user._id;
  }

  // Case 4: User ID stored directly in user.user (from some API responses)
  if (user.user && typeof user.user === 'string') {
    console.debug('getUserId found string user.user:', user.user);
    return user.user;
  }

  // Case 5: ID in data field (from API responses)
  if (user.data && typeof user.data === 'object') {
    if (user.data._id) {
      console.debug('getUserId found data._id:', user.data._id);
      return user.data._id;
    }

    if (user.data.user && typeof user.data.user === 'object' && user.data.user._id) {
      console.debug('getUserId found data.user._id:', user.data.user._id);
      return user.data.user._id;
    }
  }

  // Case 6: User ID stored in id field (some frontend transformations do this)
  if (user.id) {
    console.debug('getUserId found id:', user.id);
    return user.id;
  }

  // No valid ID found
  console.error('Could not extract user ID from user object:', user);
  return null;
};

/**
 * Validates if a string is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
