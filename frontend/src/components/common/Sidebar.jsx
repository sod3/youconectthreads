import XSvg from "../svgs/X";
import { MdHomeFilled } from "react-icons/md";
import { IoNotifications } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const Sidebar = () => {
  const queryClient = useQueryClient();
  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch("/api/auth/logout", {
          method: "POST",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: () => {
      toast.error("Logout failed");
    },
  });
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  return (
    <div className="flex">
      {/* Sidebar for large screens */}
      <div className="hidden md:flex md:w-64">
        <div className="fixed top-0 left-0 h-screen w-64 bg-black border-r border-gray-200">
          <SidebarContent authUser={authUser} logout={logout} />
        </div>
      </div>
      {/* Wrapper div for small screens (bottom fixed position) */}
      <div className='fixed md:hidden bottom-0 left-0 right-0 flex justify-around bg-black p-2 border-t border-gray-700'>
        <Link to='/'>
          <MdHomeFilled className='w-8 h-8 text-white' />
        </Link>
        <Link to='/notifications'>
          <IoNotifications className='w-6 h-6 text-white' />
        </Link>
        <Link to={`/profile/${authUser?.username}`}>
          <FaUser className='w-6 h-6 text-white' />
        </Link>
        <BiLogOut
          className='w-6 h-6 text-white cursor-pointer'
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}
        />
      </div>
    </div>
  );
};

// Separate Sidebar content for reusability
const SidebarContent = ({ authUser, logout }) => (
  <>
    <Link to='/' className='flex justify-center md:justify-start'>
      <img
        src='/youconect.png' // Replace with the path to your new logo image
        alt='Logo'
        className='w-12 h-12 rounded-full hover:bg-stone-900'
      />
    </Link>
    <ul className='flex flex-col gap-3 mt-4'>
      <li className='flex justify-center md:justify-start'>
        <Link
          to='/'
          className='flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer'
        >
          <MdHomeFilled className='w-8 h-8' />
          <span className='text-lg hidden md:block'>Home</span>
        </Link>
      </li>
      <li className='flex justify-center md:justify-start'>
        <Link
          to='/notifications'
          className='flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer'
        >
          <IoNotifications className='w-6 h-6' />
          <span className='text-lg hidden md:block'>Notifications</span>
        </Link>
      </li>

      <li className='flex justify-center md:justify-start'>
        <Link
          to={`/profile/${authUser?.username}`}
          className='flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer'
        >
          <FaUser className='w-6 h-6' />
          <span className='text-lg hidden md:block'>Profile</span>
        </Link>
      </li>
    </ul>
    {authUser && (
      <Link
        to={`/profile/${authUser.username}`}
        className='mt-auto mb-10 flex gap-2 items-start transition-all duration-300 hover:bg-[#181818] py-2 px-4 rounded-full'
      >
        <div className='avatar hidden md:inline-flex'>
          <div className='w-8 rounded-full'>
            <img src={authUser?.profileImg || "/avatar-placeholder.png"} />
          </div>
        </div>
        <div className='flex justify-between flex-1'>
          <div className='hidden md:block'>
            <p className='text-white font-bold text-sm w-20 truncate'>
              {authUser?.fullName}
            </p>
            <p className='text-slate-500 text-sm'>@{authUser?.username}</p>
          </div>
          <BiLogOut
            className='w-5 h-5 cursor-pointer'
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          />
        </div>
      </Link>
    )}
  </>
);

export default Sidebar;
