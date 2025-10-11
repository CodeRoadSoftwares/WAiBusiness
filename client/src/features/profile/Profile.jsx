import React from "react";
import { useGetUserProfileQuery } from "./api/profileApi";

function Profile() {
  const { data } = useGetUserProfileQuery();

  return (
    <div>
      <p>
        Name: {data?.firstName} {data?.lastName}
      </p>
      <p>Phone: {data?.phone}</p>
      <p>Email: {data?.email}</p>
      <p>Plan: {data?.plan}</p>
      <p>API Key: {data?.apiKey}</p>
      <p>Is Active: {data?.isActive ? "Yes" : "No"}</p>
      <p>Last Login: {data?.lastLogin}</p>
      <p>Created At: {data?.createdAt}</p>
      <p>Updated At: {data?.updatedAt}</p>
    </div>
  );
}

export default Profile;
