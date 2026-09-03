package lk.menara.globaltrade.core.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Set;

@Entity
@Table(name = "warehouse")
public class Warehouse implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "warehouse_id")
    private Integer warehouseId;

    @Column(name = "warehouse_name", nullable = false, length = 100)
    private String name;

    @Column(name = "country_code", length = 3)
    private String countryCode;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "is_main")
    private Boolean isMain = false;

    @ManyToMany(mappedBy = "managedWarehouses")
    private Set<User> managers;

    public Warehouse() {}

    public Warehouse(String name, String countryCode, Integer capacity, Boolean isMain) {
        this.name = name;
        this.countryCode = countryCode;
        this.capacity = capacity;
        this.isMain = isMain != null ? isMain : false;
    }

    public Integer getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(Integer warehouseId) {
        this.warehouseId = warehouseId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Boolean getIsMain() {
        return isMain;
    }

    public void setIsMain(Boolean isMain) {
        this.isMain = isMain;
    }

    public Set<User> getManagers() {
        return managers;
    }

    public void setManagers(Set<User> managers) {
        this.managers = managers;
    }
}