import User from "../../user.model.js";

export const createUser = async (userData, session = null) => {
  try {
    console.log("createUser.mutation.js -- Starting user creation");
    console.log(
      "createUser.mutation.js -- Session:",
      session ? "Present" : "None"
    );

    // If session is provided, use it for the transaction
    if (session) {
      console.log("createUser.mutation.js -- userData:", userData);

      try {
        console.log("createUser.mutation.js -- About to call User.create()");
        const user = await User.create([userData], { session });
        console.log("createUser.mutation.js -- User.create() result:", user);

        if (user && user.length > 0) {
          console.log("createUser.mutation.js -- Returning user[0]:", user[0]);
          return user[0];
        } else {
          console.log("createUser.mutation.js -- User array is empty or null");
          throw new Error("User creation returned empty result");
        }
      } catch (createError) {
        console.error(
          "createUser.mutation.js -- User.create() error:",
          createError
        );
        throw createError;
      }
    } else {
      // Fallback for non-transactional operations
      console.log("createUser.mutation.js -- Using non-transactional create");
      const user = await User.create(userData);
      console.log("createUser.mutation.js -- Non-transactional result:", user);
      return user;
    }
  } catch (error) {
    console.error("createUser.mutation.js -- Final error:", error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
};
