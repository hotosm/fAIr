import { TUser } from "@/types/api";
import styles from './header.module.css'
import SlAvatar from '@shoelace-style/shoelace/dist/react/avatar/index.js';
import { DropDown } from "../dropdown";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_CONTENT } from "@/utils";
import ChevronDownIcon from "../icons/chevron-down";


type UserProfileProps = {
    logout: () => void,
    user: TUser
}

const UserProfile: React.FC<UserProfileProps> = ({ logout, user }) => {

    const [dropdownIsOpened, setDropdownIsOpened] = useState(false)
    const navigate = useNavigate()
    const onDropdownShow = () => {
        setDropdownIsOpened(true)
    }

    const onDropdownHide = () => {
        setDropdownIsOpened(false)
    }

    return (
        <DropDown
            onDropdownShow={onDropdownShow}
            onDropdownHide={onDropdownHide}
            menuItems={[
                {
                    value: APP_CONTENT.navbar.userProfile.projects,
                    onClick: () => navigate('#')
                }, {
                    value: APP_CONTENT.navbar.userProfile.settings,
                    onClick: () => navigate('#')
                }, {
                    value: APP_CONTENT.navbar.userProfile.logout,
                    onClick: logout,
                    className: 'logoutButton'
                }
            ]}>
            <div className={styles.userProfile} slot="trigger">
                <SlAvatar image={user.img_url} label={user.username} loading="lazy" initials={user.username.charAt(0)} />
                <p className={styles.userProfileName}>{user.username}</p>
                <ChevronDownIcon className={`w-4 h-4 ${dropdownIsOpened && 'rotate-180'}`} />
            </div>
        </DropDown>
    )
}

export default UserProfile;